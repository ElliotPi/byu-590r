import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  Vehicle,
  VehicleDescriptionPayload,
  VehiclePayload,
  VehiclesService,
} from '../services/vehicles.service';

export interface VehiclesState {
  vehicles: Vehicle[];
  loading: boolean;
}

const initialState: VehiclesState = {
  vehicles: [],
  loading: false,
};

export const VehiclesStore = signalStore(
  { providedIn: 'root' },
  withState<VehiclesState>(initialState),
  withComputed(({ vehicles, loading }) => ({
    vehicleRows: computed(() => vehicles()),
    isLoading: computed(() => loading()),
  })),
  withMethods((store, vehiclesService = inject(VehiclesService)) => ({
    loadVehicles(): void {
      patchState(store, { loading: true });

      vehiclesService.getVehicles().subscribe({
        next: (response) => {
          patchState(store, {
            vehicles: response.results,
            loading: false,
          });
        },
        error: (error) => {
          console.error('Error fetching vehicles:', error);
          patchState(store, { loading: false });
        },
      });
    },
    addVehicle(vehicle: Vehicle): void {
      patchState(store, {
        vehicles: [...store.vehicles(), vehicle].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      });
    },
    setVehicle(vehicle: Vehicle): void {
      patchState(store, {
        vehicles: store
          .vehicles()
          .map((current) => (current.id === vehicle.id ? vehicle : current))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
    },
    removeVehicle(vehicleId: number): void {
      patchState(store, {
        vehicles: store.vehicles().filter((vehicle) => vehicle.id !== vehicleId),
      });
    },
    createVehicle(
      payload: VehiclePayload,
      file: File,
      handlers?: {
        next?: (vehicle: Vehicle) => void;
        error?: (error: unknown) => void;
      }
    ): void {
      vehiclesService.createVehicle(payload, file).subscribe({
        next: (response) => {
          this.addVehicle(response.results.vehicle);
          handlers?.next?.(response.results.vehicle);
        },
        error: (error) => {
          handlers?.error?.(error);
        },
      });
    },
    updateVehicle(
      vehicleId: number,
      payload: VehiclePayload,
      file: File | null = null,
      handlers?: {
        next?: (vehicle: Vehicle) => void;
        error?: (error: unknown) => void;
      }
    ): void {
      vehiclesService.updateVehicle(vehicleId, payload, file).subscribe({
        next: (response) => {
          this.setVehicle(response.results.vehicle);
          handlers?.next?.(response.results.vehicle);
        },
        error: (error) => {
          handlers?.error?.(error);
        },
      });
    },
    deleteVehicle(
      vehicleId: number,
      handlers?: {
        next?: () => void;
        error?: (error: unknown) => void;
      }
    ): void {
      vehiclesService.deleteVehicle(vehicleId).subscribe({
        next: () => {
          this.removeVehicle(vehicleId);
          handlers?.next?.();
        },
        error: (error) => {
          handlers?.error?.(error);
        },
      });
    },
    generateVehicleDescription(
      payload: VehicleDescriptionPayload,
      handlers?: {
        next?: (description: string) => void;
        error?: (error: unknown) => void;
      }
    ): void {
      vehiclesService.generateVehicleDescription(payload).subscribe({
        next: (response) => {
          handlers?.next?.(response.results.description);
        },
        error: (error) => {
          handlers?.error?.(error);
        },
      });
    },
  }))
);
