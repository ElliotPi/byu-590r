import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { VehiclesService, Vehicle } from '../services/vehicles.service';

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
  }))
);
