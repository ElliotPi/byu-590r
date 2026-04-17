import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ServiceType {
  id: number;
  name: string;
  category?: string | null;
  default_interval_miles?: number | null;
  default_interval_months?: number | null;
}

export interface Part {
  id: number;
  name: string;
  brand?: string | null;
  part_number?: string | null;
  unit?: string | null;
}

export interface ServiceRecordNote {
  note: string;
}

export interface ServiceRecordPartPivot {
  quantity: number;
  unit_price?: number | null;
  line_total?: number | null;
}

export interface ServiceRecord {
  id: number;
  vehicle_id: number;
  service_type_id: number;
  performed_at: string;
  odometer_miles: number;
  is_diy: boolean;
  shop_name?: string | null;
  labor_cost?: number | null;
  parts_cost?: number | null;
  total_cost?: number | null;
  notes?: string | null;
  receipt_image?: string | null;
  receipt_image_url?: string | null;
  receipt_images?: Array<{
    id: number;
    file_path: string;
    file_url: string | null;
    sort_order: number;
  }>;
  service_images?: Array<{
    id: number;
    file_path: string;
    file_url: string | null;
    sort_order: number;
  }>;
  vehicle?: { id: number; name: string; year: number; make: string; model: string };
  service_type?: ServiceType;
  parts?: Array<Part & { pivot?: ServiceRecordPartPivot }>;
  note?: ServiceRecordNote;
}

export interface ServiceRecordPayload {
  vehicle_id: number;
  service_type_id: number;
  performed_at: string;
  odometer_miles: number;
  is_diy: boolean;
  shop_name?: string;
  labor_cost?: number;
  parts_cost?: number;
  notes?: string;
  note: string;
  part_ids: number[];
  part_quantities?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ServiceRecordsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private getAuthHeaders(): { [key: string]: string } {
    const user = this.authService.getStoredUser();
    if (user && user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
    return {};
  }

  private getMultipartAuthHeaders(): { [key: string]: string } {
    const user = this.authService.getStoredUser();
    if (user && user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
    return {};
  }

  getServiceRecords(): Observable<{
    success: boolean;
    results: { records: ServiceRecord[]; service_types: ServiceType[]; parts: Part[] };
    message: string;
  }> {
    return this.http.get<{
      success: boolean;
      results: { records: ServiceRecord[]; service_types: ServiceType[]; parts: Part[] };
      message: string;
    }>(`${this.apiUrl}service-records`, { headers: this.getAuthHeaders() });
  }

  createServiceRecord(
    payload: ServiceRecordPayload,
    receiptFiles: File[],
    serviceFiles: File[] = []
  ): Observable<{ success: boolean; results: { record: ServiceRecord }; message: string }> {
    const formData = this.buildFormData(payload, receiptFiles, serviceFiles);
    return this.http.post<{ success: boolean; results: { record: ServiceRecord }; message: string }>(
      `${this.apiUrl}service-records`,
      formData,
      { headers: this.getMultipartAuthHeaders() }
    );
  }

  updateServiceRecord(
    recordId: number,
    payload: ServiceRecordPayload,
    receiptFiles: File[] = [],
    serviceFiles: File[] = []
  ): Observable<{ success: boolean; results: { record: ServiceRecord }; message: string }> {
    const formData = this.buildFormData(payload, receiptFiles, serviceFiles);
    formData.append('_method', 'PUT');
    return this.http.post<{ success: boolean; results: { record: ServiceRecord }; message: string }>(
      `${this.apiUrl}service-records/${recordId}`,
      formData,
      { headers: this.getMultipartAuthHeaders() }
    );
  }

  deleteServiceRecord(recordId: number): Observable<{ success: boolean; results: { record: { id: number } }; message: string }> {
    return this.http.delete<{ success: boolean; results: { record: { id: number } }; message: string }>(
      `${this.apiUrl}service-records/${recordId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  private buildFormData(
    payload: ServiceRecordPayload,
    receiptFiles: File[] = [],
    serviceFiles: File[] = []
  ): FormData {
    const formData = new FormData();
    formData.append('vehicle_id', payload.vehicle_id.toString());
    formData.append('service_type_id', payload.service_type_id.toString());
    formData.append('performed_at', payload.performed_at);
    formData.append('odometer_miles', payload.odometer_miles.toString());
    formData.append('is_diy', payload.is_diy ? '1' : '0');
    if (payload.shop_name) {
      formData.append('shop_name', payload.shop_name);
    }
    if (payload.labor_cost !== undefined && payload.labor_cost !== null) {
      formData.append('labor_cost', payload.labor_cost.toString());
    }
    if (payload.parts_cost !== undefined && payload.parts_cost !== null) {
      formData.append('parts_cost', payload.parts_cost.toString());
    }
    if (payload.notes) {
      formData.append('notes', payload.notes);
    }
    formData.append('note', payload.note);
    payload.part_ids.forEach((partId) => {
      formData.append('part_ids[]', partId.toString());
    });
    (payload.part_quantities || []).forEach((qty) => {
      formData.append('part_quantities[]', qty.toString());
    });
    receiptFiles.forEach((file) => {
      formData.append('receipt_files[]', file);
    });
    serviceFiles.forEach((file) => {
      formData.append('service_files[]', file);
    });
    return formData;
  }
}
