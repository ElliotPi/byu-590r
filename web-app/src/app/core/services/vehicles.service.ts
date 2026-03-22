import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface VehicleImage {
  id: number;
  file_path: string;
  file_url: string | null;
  caption?: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Vehicle {
  id: number;
  user_id: number;
  name: string;
  description: string;
  nickname?: string | null;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  engine?: string | null;
  vin: string;
  license_plate?: string | null;
  purchase_date?: string | null;
  vehicle_picture: string | null;
  images: VehicleImage[];
}

@Injectable({
  providedIn: 'root',
})
export class VehiclesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private getAuthHeaders(): { [key: string]: string } {
    const user = this.authService.getStoredUser();
    if (user?.token) {
      return { Authorization: `Bearer ${user.token}` };
    }

    return {};
  }

  getVehicles(): Observable<{
    success: boolean;
    results: Vehicle[];
    message: string;
  }> {
    return this.http.get<{
      success: boolean;
      results: Vehicle[];
      message: string;
    }>(`${this.apiUrl}vehicles`, {
      headers: this.getAuthHeaders(),
    });
  }
}
