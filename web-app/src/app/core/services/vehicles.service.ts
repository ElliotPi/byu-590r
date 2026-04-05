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

export interface VehiclePayload {
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
}

export interface VehicleDescriptionPayload {
  year: number;
  make: string;
  model: string;
  nickname?: string | null;
  trim?: string | null;
  engine?: string | null;
  use_case?: string | null;
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

  private buildVehicleFormData(
    payload: VehiclePayload,
    file?: File | null,
    includePutOverride = false
  ): FormData {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('year', payload.year.toString());
    formData.append('make', payload.make);
    formData.append('model', payload.model);
    formData.append('vin', payload.vin);

    if (payload.nickname) {
      formData.append('nickname', payload.nickname);
    }
    if (payload.trim) {
      formData.append('trim', payload.trim);
    }
    if (payload.engine) {
      formData.append('engine', payload.engine);
    }
    if (payload.license_plate) {
      formData.append('license_plate', payload.license_plate);
    }
    if (payload.purchase_date) {
      formData.append('purchase_date', payload.purchase_date);
    }
    if (file) {
      formData.append('file', file);
    }

    if (includePutOverride) {
      formData.append('_method', 'PUT');
    }

    return formData;
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

  createVehicle(
    payload: VehiclePayload,
    file: File
  ): Observable<{
    success: boolean;
    results: { vehicle: Vehicle };
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      results: { vehicle: Vehicle };
      message: string;
    }>(`${this.apiUrl}vehicles`, this.buildVehicleFormData(payload, file), {
      headers: this.getAuthHeaders(),
    });
  }

  updateVehicle(
    id: number,
    payload: VehiclePayload,
    file?: File | null
  ): Observable<{
    success: boolean;
    results: { vehicle: Vehicle };
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      results: { vehicle: Vehicle };
      message: string;
    }>(
      `${this.apiUrl}vehicles/${id}`,
      this.buildVehicleFormData(payload, file, true),
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  deleteVehicle(id: number): Observable<{
    success: boolean;
    results: { vehicle: { id: number } };
    message: string;
  }> {
    return this.http.delete<{
      success: boolean;
      results: { vehicle: { id: number } };
      message: string;
    }>(`${this.apiUrl}vehicles/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  generateVehicleDescription(
    payload: VehicleDescriptionPayload
  ): Observable<{
    success: boolean;
    results: { description: string; model?: string | null };
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      results: { description: string; model?: string | null };
      message: string;
    }>(`${this.apiUrl}vehicles/generate_description`, payload, {
      headers: this.getAuthHeaders(),
    });
  }
}
