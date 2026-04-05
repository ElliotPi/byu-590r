import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  clearFormErrors,
  getFieldError,
  setFormErrors,
} from '../core/utils/form.utils';
import {
  Vehicle,
  VehicleDescriptionPayload,
  VehiclePayload,
} from '../core/services/vehicles.service';
import { VehiclesStore } from '../core/stores/vehicles.store';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent implements OnInit {
  private vehiclesStore = inject(VehiclesStore);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  vehicles = computed(() => this.vehiclesStore.vehicleRows());
  isLoading = computed(() => this.vehiclesStore.isLoading());

  createVehicleDialog = signal(false);
  editVehicleDialog = signal(false);
  deleteVehicleDialog = signal(false);

  selectedDeleteVehicle = signal<Vehicle | null>(null);
  editingVehicle = signal<Vehicle | null>(null);

  selectedCreateFile = signal<File | null>(null);
  selectedEditFile = signal<File | null>(null);
  editPreviewUrl = signal<string | null>(null);

  vehicleIsCreating = signal(false);
  vehicleIsUpdating = signal(false);
  vehicleIsDeleting = signal(false);
  descriptionIsGenerating = signal(false);

  createVehicleErrorMessage = signal<string | null>(null);
  editVehicleErrorMessage = signal<string | null>(null);

  createVehicleForm: FormGroup;
  editVehicleForm: FormGroup;

  constructor() {
    this.createVehicleForm = this.buildVehicleForm(true);
    this.editVehicleForm = this.buildVehicleForm(false);
  }

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.vehiclesStore.loadVehicles();
  }

  openCreateDialog(): void {
    this.createVehicleForm.reset({
      name: '',
      description: '',
      nickname: '',
      year: new Date().getFullYear(),
      make: '',
      model: '',
      trim: '',
      engine: '',
      vin: '',
      license_plate: '',
      purchase_date: '',
      use_case: '',
      file: null,
    });
    this.selectedCreateFile.set(null);
    this.createVehicleErrorMessage.set(null);
    this.createVehicleDialog.set(true);
  }

  closeCreateDialog(): void {
    this.selectedCreateFile.set(null);
    this.createVehicleErrorMessage.set(null);
    this.createVehicleDialog.set(false);
  }

  openEditDialog(vehicle: Vehicle): void {
    this.editingVehicle.set(vehicle);
    this.editVehicleForm.reset({
      name: vehicle.name,
      description: vehicle.description,
      nickname: vehicle.nickname || '',
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim || '',
      engine: vehicle.engine || '',
      vin: vehicle.vin,
      license_plate: vehicle.license_plate || '',
      purchase_date: this.formatPurchaseDateForForm(vehicle.purchase_date || ''),
      use_case: '',
    });
    this.selectedEditFile.set(null);
    this.editPreviewUrl.set(vehicle.vehicle_picture || null);
    this.editVehicleErrorMessage.set(null);
    this.editVehicleDialog.set(true);
  }

  closeEditDialog(): void {
    this.editVehicleErrorMessage.set(null);
    this.selectedEditFile.set(null);
    this.revokeEditPreviewUrl();
    this.editingVehicle.set(null);
    this.editVehicleDialog.set(false);
  }

  openDeleteDialog(vehicle: Vehicle): void {
    this.selectedDeleteVehicle.set(vehicle);
    this.deleteVehicleDialog.set(true);
  }

  closeDeleteDialog(): void {
    this.selectedDeleteVehicle.set(null);
    this.deleteVehicleDialog.set(false);
  }

  onCreateVehicleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.selectedCreateFile.set(file);
    this.createVehicleForm.patchValue({ file });
    this.createVehicleForm.get('file')?.updateValueAndValidity();
  }

  onEditVehicleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedEditFile.set(file);

    this.revokeEditPreviewUrl();

    if (file) {
      this.editPreviewUrl.set(URL.createObjectURL(file));
      return;
    }

    this.editPreviewUrl.set(this.editingVehicle()?.vehicle_picture || null);
  }

  onVinInput(form: FormGroup, event: Event): void {
    const input = event.target as HTMLInputElement;
    const upperValue = (input.value || '').toUpperCase();
    input.value = upperValue;
    form.get('vin')?.setValue(upperValue, { emitEvent: false });
  }

  createVehicle(): void {
    if (!this.createVehicleForm.valid || !this.selectedCreateFile()) {
      this.createVehicleForm.markAllAsTouched();
      return;
    }

    this.vehicleIsCreating.set(true);
    this.createVehicleErrorMessage.set(null);
    clearFormErrors(this.createVehicleForm);

    this.vehiclesStore.createVehicle(
      this.buildVehiclePayload(this.createVehicleForm),
      this.selectedCreateFile()!,
      {
        next: () => {
          this.vehicleIsCreating.set(false);
          this.closeCreateDialog();
          this.snackBar.open('Vehicle created successfully.', 'Close', {
            duration: 3000,
          });
        },
        error: (error: any) => {
          this.vehicleIsCreating.set(false);
          this.handleFormError(
            this.createVehicleForm,
            error,
            this.createVehicleErrorMessage,
            'Error creating vehicle'
          );
        },
      }
    );
  }

  updateVehicle(): void {
    const vehicle = this.editingVehicle();
    if (!vehicle || !this.editVehicleForm.valid) {
      this.editVehicleForm.markAllAsTouched();
      return;
    }

    this.vehicleIsUpdating.set(true);
    this.editVehicleErrorMessage.set(null);
    clearFormErrors(this.editVehicleForm);

    const payload = this.buildVehiclePayload(this.editVehicleForm);
    this.commitVehicleUpdate(vehicle.id, payload, this.selectedEditFile());
  }

  deleteVehicle(): void {
    const vehicle = this.selectedDeleteVehicle();
    if (!vehicle) {
      return;
    }

    this.vehicleIsDeleting.set(true);

    this.vehiclesStore.deleteVehicle(vehicle.id, {
      next: () => {
        this.vehicleIsDeleting.set(false);
        this.closeDeleteDialog();
        this.snackBar.open('Vehicle deleted successfully.', 'Close', {
          duration: 3000,
        });
      },
      error: (error: any) => {
        this.vehicleIsDeleting.set(false);
        const message = error?.error?.message || 'Error deleting vehicle';
        this.snackBar.open(message, 'Close', {
          duration: 4000,
        });
      },
    });
  }

  generateCreateDescription(): void {
    this.generateDescriptionFromForm(this.createVehicleForm, true);
  }

  generateEditDescription(): void {
    this.generateDescriptionFromForm(this.editVehicleForm, false);
  }

  getFieldError = getFieldError;

  private buildVehicleForm(includeFile: boolean): FormGroup {
    const group = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      nickname: [''],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(1886)]],
      make: ['', [Validators.required]],
      model: ['', [Validators.required]],
      trim: [''],
      engine: [''],
      vin: ['', [Validators.required, Validators.minLength(17), Validators.maxLength(17)]],
      license_plate: [''],
      purchase_date: [''],
      use_case: [''],
    });

    if (includeFile) {
      (group as FormGroup).addControl(
        'file',
        this.fb.control<File | null>(null, [Validators.required])
      );
    }

    return group;
  }

  private buildVehiclePayload(form: FormGroup): VehiclePayload {
    const formValue = form.getRawValue();

    return {
      name: (formValue['name'] || '').trim(),
      description: (formValue['description'] || '').trim(),
      nickname: (formValue['nickname'] || '').trim() || null,
      year: Number(formValue['year']),
      make: (formValue['make'] || '').trim(),
      model: (formValue['model'] || '').trim(),
      trim: (formValue['trim'] || '').trim() || null,
      engine: (formValue['engine'] || '').trim() || null,
      vin: ((formValue['vin'] || '') as string).trim().toUpperCase(),
      license_plate: (formValue['license_plate'] || '').trim() || null,
      purchase_date: this.normalizePurchaseDate((formValue['purchase_date'] || '').trim()),
    };
  }

  private buildDescriptionPayload(form: FormGroup): VehicleDescriptionPayload {
    const formValue = form.getRawValue();

    return {
      year: Number(formValue['year']),
      make: (formValue['make'] || '').trim(),
      model: (formValue['model'] || '').trim(),
      nickname: (formValue['nickname'] || '').trim() || null,
      trim: (formValue['trim'] || '').trim() || null,
      engine: (formValue['engine'] || '').trim() || null,
      use_case: (formValue['use_case'] || '').trim() || null,
    };
  }

  private commitVehicleUpdate(
    vehicleId: number,
    payload: VehiclePayload,
    file: File | null = null
  ): void {
    this.vehiclesStore.updateVehicle(vehicleId, payload, file, {
      next: () => {
        this.vehicleIsUpdating.set(false);
        this.closeEditDialog();
        this.snackBar.open('Vehicle updated successfully.', 'Close', {
          duration: 3000,
        });
      },
      error: (error: any) => {
        this.vehicleIsUpdating.set(false);
        this.handleFormError(
          this.editVehicleForm,
          error,
          this.editVehicleErrorMessage,
          'Error updating vehicle'
        );
      },
    });
  }

  private generateDescriptionFromForm(form: FormGroup, isCreateForm: boolean): void {
    if (
      !form.get('year')?.value ||
      !form.get('make')?.value ||
      !form.get('model')?.value
    ) {
      form.get('year')?.markAsTouched();
      form.get('make')?.markAsTouched();
      form.get('model')?.markAsTouched();
      const errorMessage =
        'Year, make, and model are required before generating a description.';
      if (isCreateForm) {
        this.createVehicleErrorMessage.set(errorMessage);
      } else {
        this.editVehicleErrorMessage.set(errorMessage);
      }
      return;
    }

    this.descriptionIsGenerating.set(true);

    this.vehiclesStore.generateVehicleDescription(this.buildDescriptionPayload(form), {
      next: (description) => {
        form.patchValue({ description });
        this.descriptionIsGenerating.set(false);
        this.snackBar.open('Vehicle description generated.', 'Close', {
          duration: 3000,
        });
      },
      error: (error: any) => {
        const message =
          error?.error?.message || 'Error generating AI vehicle description';
        if (isCreateForm) {
          this.createVehicleErrorMessage.set(message);
        } else {
          this.editVehicleErrorMessage.set(message);
        }
        this.descriptionIsGenerating.set(false);
      },
    });
  }

  private handleFormError(
    form: FormGroup,
    error: any,
    errorSignal: { set: (value: string | null) => void },
    fallbackMessage: string
  ): void {
    if (error?.error?.data && typeof error.error.data === 'object') {
      setFormErrors(form, error.error.data);
      errorSignal.set('Please fix the validation errors below.');
      return;
    }

    errorSignal.set(error?.error?.message || fallbackMessage);
  }

  private formatPurchaseDateForForm(value: string): string {
    if (!value) {
      return '';
    }

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!isoMatch) {
      return value;
    }

    const [, year, month, day] = isoMatch;
    return `${month}/${day}/${year}`;
  }

  private normalizePurchaseDate(value: string): string | null {
    if (!value) {
      return null;
    }

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return value;
    }

    const usMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      return `${year}-${month}-${day}`;
    }

    return value;
  }

  private revokeEditPreviewUrl(): void {
    const previewUrl = this.editPreviewUrl();

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    this.editPreviewUrl.set(null);
  }
}
