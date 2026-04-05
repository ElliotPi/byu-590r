import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../core/stores/auth.store';

interface GarageChecklistItem {
  label: string;
  note: string;
}

interface GarageMetric {
  label: string;
  value: string;
}

interface GarageShortcut {
  title: string;
  description: string;
  icon: string;
  route: string;
  buttonLabel: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  readonly userName = computed(() => this.authStore.userName() || 'Driver');

  readonly metrics: GarageMetric[] = [
    { label: 'Tracked Vehicles', value: '5' },
    { label: 'Open Service Logs', value: '12' },
    { label: 'DIY Priority This Week', value: 'Oil + Inspection' },
  ];

  readonly checklist: GarageChecklistItem[] = [
    {
      label: 'Log mileage before each service',
      note: 'Keeps your maintenance timeline accurate and useful later.',
    },
    {
      label: 'Upload a clear vehicle cover photo',
      note: 'Makes each car easy to identify from the garage list.',
    },
    {
      label: 'Track parts and notes while the job is fresh',
      note: 'You will thank yourself on the next repair.',
    },
  ];

  readonly shortcuts: GarageShortcut[] = [
    {
      title: 'Open Garage',
      description: 'View all vehicles, update photos, and keep each car organized in one place.',
      icon: 'directions_car',
      route: '/vehicles',
      buttonLabel: 'View Vehicles',
    },
    {
      title: 'Plan Maintenance',
      description: 'Use each vehicle record to map oil changes, tire rotations, inspections, and parts.',
      icon: 'build',
      route: '/vehicles',
      buttonLabel: 'Start Planning',
    },
    {
      title: 'Stay Consistent',
      description: 'Good records turn DIY work into a repeatable system instead of guesswork.',
      icon: 'check_circle',
      route: '/vehicles',
      buttonLabel: 'Keep Logging',
    },
  ];

  goToVehicles(): void {
    this.router.navigate(['/vehicles']);
  }
}
