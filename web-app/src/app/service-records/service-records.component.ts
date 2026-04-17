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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import {
  clearFormErrors,
  getFieldError,
  setFormErrors,
} from '../core/utils/form.utils';
import { VehiclesStore } from '../core/stores/vehicles.store';
import {
  Part,
  ServiceRecord,
  ServiceRecordPayload,
  ServiceType,
} from '../core/services/service-records.service';
import { ServiceRecordsStore } from '../core/stores/service-records.store';

@Component({
  selector: 'app-service-records',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './service-records.component.html',
  styleUrl: './service-records.component.scss',
})
export class ServiceRecordsComponent implements OnInit {
  private recordsStore = inject(ServiceRecordsStore);
  private vehiclesStore = inject(VehiclesStore);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  records = computed(() => this.recordsStore.records());
  serviceTypes = computed(() => this.recordsStore.serviceTypes());
  parts = computed(() => this.recordsStore.parts());
  vehicles = computed(() => this.vehiclesStore.vehicleRows());
  isLoading = computed(() => this.recordsStore.isLoading());
  vehicleFilterId = signal<number | null>(null);
  filteredRecords = computed(() => {
    const filterId = this.vehicleFilterId();
    if (!filterId) {
      return this.records();
    }
    return this.records().filter((record) => record.vehicle_id === filterId);
  });
  filteredVehicle = computed(() => {
    const filterId = this.vehicleFilterId();
    if (!filterId) {
      return null;
    }
    return this.vehicles().find((vehicle) => vehicle.id === filterId) || null;
  });
  summaryCards = computed(() => {
    const records = this.filteredRecords();
    const diyCount = records.filter((record) => record.is_diy).length;
    const receiptsCount = records.reduce(
      (sum, record) => sum + this.getOrderedReceiptImages(record).length,
      0
    );

    return [
      {
        label: 'Visible Records',
        value: records.length,
        icon: 'build_circle',
      },
      {
        label: 'DIY Jobs',
        value: diyCount,
        icon: 'handyman',
      },
      {
        label: 'Receipt Images',
        value: receiptsCount,
        icon: 'receipt_long',
      },
    ];
  });

  createDialog = signal(false);
  editDialog = signal(false);
  deleteDialog = signal(false);

  selectedDeleteRecord = signal<ServiceRecord | null>(null);
  editingRecord = signal<ServiceRecord | null>(null);

  selectedCreateReceiptFiles = signal<File[]>([]);
  selectedCreateServiceFiles = signal<File[]>([]);
  selectedEditReceiptFiles = signal<File[]>([]);
  selectedEditServiceFiles = signal<File[]>([]);
  editPreviewUrl = signal<string | null>(null);

  recordIsCreating = signal(false);
  recordIsUpdating = signal(false);
  recordIsDeleting = signal(false);

  createErrorMessage = signal<string | null>(null);
  editErrorMessage = signal<string | null>(null);
  createPartsTouched = signal(false);
  editPartsTouched = signal(false);

  createForm: FormGroup;
  editForm: FormGroup;

  selectedPartIds = signal<number[]>([]);
  selectedEditPartIds = signal<number[]>([]);
  partQuantities = signal<Record<number, number>>({});
  editPartQuantities = signal<Record<number, number>>({});

  constructor() {
    this.createForm = this.buildForm();
    this.editForm = this.buildForm();
  }

  ngOnInit(): void {
    this.vehiclesStore.loadVehicles();
    this.recordsStore.loadServiceRecords();
    this.route.queryParamMap.subscribe((params) => {
      const rawVehicleId = params.get('vehicleId');
      const parsedVehicleId = rawVehicleId ? Number(rawVehicleId) : null;
      this.vehicleFilterId.set(
        parsedVehicleId && Number.isFinite(parsedVehicleId) ? parsedVehicleId : null
      );
    });
  }

  openCreateDialog(): void {
    this.createForm.reset({
      vehicle_id: null,
      service_type_id: null,
      performed_at: '',
      odometer_miles: '',
      is_diy: true,
      shop_name: '',
      labor_cost: 0,
      parts_cost: 0,
      notes: '',
      note: '',
    });
    this.selectedCreateReceiptFiles.set([]);
    this.selectedCreateServiceFiles.set([]);
    this.createForm.get('receipt_files')?.setValidators([Validators.required]);
    this.createForm.get('receipt_files')?.updateValueAndValidity();
    this.selectedPartIds.set([]);
    this.partQuantities.set({});
    this.createPartsTouched.set(false);
    this.createErrorMessage.set(null);
    this.createDialog.set(true);
  }

  closeCreateDialog(): void {
    this.selectedCreateReceiptFiles.set([]);
    this.selectedCreateServiceFiles.set([]);
    this.createForm.get('receipt_files')?.clearValidators();
    this.createForm.get('receipt_files')?.updateValueAndValidity();
    this.selectedPartIds.set([]);
    this.partQuantities.set({});
    this.createPartsTouched.set(false);
    this.createErrorMessage.set(null);
    this.createDialog.set(false);
  }

  openEditDialog(record: ServiceRecord): void {
    this.editingRecord.set(record);
    this.editForm.reset({
      vehicle_id: record.vehicle_id,
      service_type_id: record.service_type_id,
      performed_at: this.formatDateForInput(record.performed_at),
      odometer_miles: record.odometer_miles,
      is_diy: record.is_diy,
      shop_name: record.shop_name || '',
      labor_cost: record.labor_cost ?? 0,
      parts_cost: record.parts_cost ?? 0,
      notes: record.notes || '',
      note: record.note?.note || '',
    });
    const partIds = (record.parts || []).map((part) => part.id);
    this.selectedEditPartIds.set(partIds);
    const quantities: Record<number, number> = {};
    (record.parts || []).forEach((part) => {
      quantities[part.id] = part.pivot?.quantity ?? 1;
    });
    this.editPartQuantities.set(quantities);
    this.selectedEditReceiptFiles.set([]);
    this.selectedEditServiceFiles.set([]);
    this.editForm.get('receipt_files')?.clearValidators();
    this.editForm.get('receipt_files')?.updateValueAndValidity();
    this.editPreviewUrl.set(record.receipt_images?.[0]?.file_url || record.receipt_image_url || null);
    this.editPartsTouched.set(false);
    this.editErrorMessage.set(null);
    this.editDialog.set(true);
  }

  closeEditDialog(): void {
    this.editingRecord.set(null);
    this.selectedEditReceiptFiles.set([]);
    this.selectedEditServiceFiles.set([]);
    this.editPreviewUrl.set(null);
    this.selectedEditPartIds.set([]);
    this.editPartQuantities.set({});
    this.editPartsTouched.set(false);
    this.editErrorMessage.set(null);
    this.editDialog.set(false);
  }

  openDeleteDialog(record: ServiceRecord): void {
    this.selectedDeleteRecord.set(record);
    this.deleteDialog.set(true);
  }

  closeDeleteDialog(): void {
    this.selectedDeleteRecord.set(null);
    this.deleteDialog.set(false);
  }

  onCreateReceiptFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.selectedCreateReceiptFiles.set(files);
    this.createForm.patchValue({ receipt_files: files.length ? files : null });
    this.createForm.get('receipt_files')?.updateValueAndValidity();
  }

  onCreateServiceFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.selectedCreateServiceFiles.set(files);
  }

  onEditReceiptFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.selectedEditReceiptFiles.set(files);
    if (files.length > 0) {
      this.editPreviewUrl.set(URL.createObjectURL(files[0]));
    } else {
      this.editPreviewUrl.set(this.editingRecord()?.receipt_images?.[0]?.file_url || this.editingRecord()?.receipt_image_url || null);
    }
  }

  onEditServiceFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.selectedEditServiceFiles.set(files);
  }

  togglePart(part: Part, checked: boolean, isEdit: boolean): void {
    const current = isEdit ? this.selectedEditPartIds() : this.selectedPartIds();
    const next = checked
      ? Array.from(new Set([...current, part.id]))
      : current.filter((id) => id !== part.id);

    if (isEdit) {
      this.selectedEditPartIds.set(next);
    } else {
      this.selectedPartIds.set(next);
    }
  }

  updatePartQuantity(partId: number, value: string, isEdit: boolean): void {
    const qty = Math.max(1, Number(value) || 1);
    if (isEdit) {
      this.editPartQuantities.set({
        ...this.editPartQuantities(),
        [partId]: qty,
      });
    } else {
      this.partQuantities.set({
        ...this.partQuantities(),
        [partId]: qty,
      });
    }
  }

  createRecord(): void {
    this.createPartsTouched.set(true);
    if (!this.createForm.valid || this.selectedCreateReceiptFiles().length === 0) {
      if (this.selectedCreateReceiptFiles().length === 0) {
        this.createForm.get('receipt_files')?.setErrors({ required: true });
      }
      this.createForm.markAllAsTouched();
      return;
    }

    const partIds = this.selectedPartIds();
    if (!partIds.length) {
      this.createErrorMessage.set('Select at least one part used.');
      return;
    }

    this.recordIsCreating.set(true);
    this.createErrorMessage.set(null);
    clearFormErrors(this.createForm);

    const payload = this.buildPayload(this.createForm, partIds, this.partQuantities());

    this.recordsStore.createRecord(
      payload,
      this.selectedCreateReceiptFiles(),
      this.selectedCreateServiceFiles(),
      {
      next: () => {
        this.recordIsCreating.set(false);
        this.closeCreateDialog();
        this.snackBar.open('Service record created.', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.recordIsCreating.set(false);
        this.handleFormError(this.createForm, error, this.createErrorMessage, 'Error creating record');
      },
    });
  }

  updateRecord(): void {
    const record = this.editingRecord();
    this.editPartsTouched.set(true);
    if (!record || !this.editForm.valid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const partIds = this.selectedEditPartIds();
    if (!partIds.length) {
      this.editErrorMessage.set('Select at least one part used.');
      return;
    }

    this.recordIsUpdating.set(true);
    this.editErrorMessage.set(null);
    clearFormErrors(this.editForm);

    const payload = this.buildPayload(this.editForm, partIds, this.editPartQuantities());

    this.recordsStore.updateRecord(
      record.id,
      payload,
      this.selectedEditReceiptFiles(),
      this.selectedEditServiceFiles(),
      {
      next: () => {
        this.recordIsUpdating.set(false);
        this.closeEditDialog();
        this.snackBar.open('Service record updated.', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.recordIsUpdating.set(false);
        this.handleFormError(this.editForm, error, this.editErrorMessage, 'Error updating record');
      },
    });
  }

  deleteRecord(): void {
    const record = this.selectedDeleteRecord();
    if (!record) {
      return;
    }

    this.recordIsDeleting.set(true);

    this.recordsStore.deleteRecord(record.id, {
      next: () => {
        this.recordIsDeleting.set(false);
        this.closeDeleteDialog();
        this.snackBar.open('Service record deleted.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.recordIsDeleting.set(false);
        this.snackBar.open('Error deleting service record.', 'Close', { duration: 3000 });
      },
    });
  }

  getServiceTypeName(id: number, serviceTypes: ServiceType[]): string {
    return serviceTypes.find((type) => type.id === id)?.name || 'Unknown';
  }

  getPartName(id: number, parts: Part[]): string {
    return parts.find((part) => part.id === id)?.name || 'Unknown';
  }

  getSelectedParts(ids: number[], parts: Part[]): Part[] {
    return parts.filter((part) => ids.includes(part.id));
  }

  getOrderedReceiptImages(record: ServiceRecord | null | undefined): Array<{
    id: number;
    file_path: string;
    file_url: string | null;
    sort_order: number;
  }> {
    return [...(record?.receipt_images || [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  getOrderedServiceImages(record: ServiceRecord | null | undefined): Array<{
    id: number;
    file_path: string;
    file_url: string | null;
    sort_order: number;
  }> {
    return [...(record?.service_images || [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  getPrimaryReceiptUrl(record: ServiceRecord): string | null {
    const ordered = this.getOrderedReceiptImages(record);
    return ordered[0]?.file_url || record.receipt_image_url || null;
  }

  canSubmitCreate(): boolean {
    return (
      !this.recordIsCreating() &&
      this.createForm.valid &&
      this.selectedCreateReceiptFiles().length > 0 &&
      this.selectedPartIds().length > 0
    );
  }

  canSubmitUpdate(): boolean {
    return (
      !this.recordIsUpdating() &&
      this.editForm.valid &&
      this.selectedEditPartIds().length > 0
    );
  }

  showCreatePartsError(): boolean {
    return this.createPartsTouched() && this.selectedPartIds().length === 0;
  }

  showEditPartsError(): boolean {
    return this.editPartsTouched() && this.selectedEditPartIds().length === 0;
  }

  clearVehicleFilter(): void {
    this.router.navigate(['/service-records']);
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      vehicle_id: [null, Validators.required],
      service_type_id: [null, Validators.required],
      performed_at: ['', Validators.required],
      odometer_miles: ['', [Validators.required, Validators.min(0)]],
      is_diy: [true, Validators.required],
      shop_name: [''],
      labor_cost: [0, [Validators.min(0)]],
      parts_cost: [0, [Validators.min(0)]],
      notes: [''],
      note: ['', Validators.required],
      receipt_files: [null],
    });
  }

  private buildPayload(form: FormGroup, partIds: number[], quantities: Record<number, number>): ServiceRecordPayload {
    const value = form.value;
    const qtyList = partIds.map((id) => quantities[id] ?? 1);
    return {
      vehicle_id: Number(value.vehicle_id),
      service_type_id: Number(value.service_type_id),
      performed_at: value.performed_at,
      odometer_miles: Number(value.odometer_miles),
      is_diy: Boolean(value.is_diy),
      shop_name: value.shop_name || undefined,
      labor_cost: value.labor_cost !== '' ? Number(value.labor_cost) : 0,
      parts_cost: value.parts_cost !== '' ? Number(value.parts_cost) : 0,
      notes: value.notes || undefined,
      note: value.note,
      part_ids: partIds,
      part_quantities: qtyList,
    };
  }

  private handleFormError(
    form: FormGroup,
    error: any,
    errorSignal: { set: (value: string | null) => void },
    fallbackMessage: string
  ): void {
    const responseErrors = error?.error?.data;
    if (responseErrors) {
      setFormErrors(form, responseErrors);
    }
    errorSignal.set(error?.error?.message || fallbackMessage);
  }

  getFieldError(form: FormGroup, fieldName: string): string | null {
    return getFieldError(form, fieldName);
  }

  private formatDateForInput(value: string): string {
    if (!value) {
      return '';
    }
    return value.includes('T') ? value.split('T')[0] : value;
  }
}
