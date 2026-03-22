import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { VehiclesStore } from '../core/stores/vehicles.store';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent implements OnInit {
  private vehiclesStore = inject(VehiclesStore);

  vehicles = computed(() => this.vehiclesStore.vehicleRows());
  isLoading = computed(() => this.vehiclesStore.isLoading());

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.vehiclesStore.loadVehicles();
  }
}
