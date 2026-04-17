import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import {
  Part,
  ServiceRecord,
  ServiceRecordPayload,
  ServiceRecordsService,
  ServiceType,
} from '../services/service-records.service';

export interface ServiceRecordsState {
  records: ServiceRecord[];
  serviceTypes: ServiceType[];
  parts: Part[];
  isLoading: boolean;
}

const initialState: ServiceRecordsState = {
  records: [],
  serviceTypes: [],
  parts: [],
  isLoading: false,
};

export const ServiceRecordsStore = signalStore(
  { providedIn: 'root' },
  withState<ServiceRecordsState>(initialState),
  withComputed(({ records, serviceTypes, parts, isLoading }) => ({
    records: computed(() => records()),
    serviceTypes: computed(() => serviceTypes()),
    parts: computed(() => parts()),
    isLoading: computed(() => isLoading()),
  })),
  withMethods((store) => {
    const service = inject(ServiceRecordsService);

    return {
      setLoading(loading: boolean): void {
        patchState(store, { isLoading: loading });
      },
      setRecords(records: ServiceRecord[]): void {
        patchState(store, { records });
      },
      setOptions(serviceTypes: ServiceType[], parts: Part[]): void {
        patchState(store, { serviceTypes, parts });
      },
      addRecord(record: ServiceRecord): void {
        patchState(store, { records: [record, ...store.records()] });
      },
      setRecord(record: ServiceRecord): void {
        patchState(store, {
          records: store.records().map((item) => (item.id === record.id ? record : item)),
        });
      },
      removeRecord(recordId: number): void {
        patchState(store, {
          records: store.records().filter((item) => item.id !== recordId),
        });
      },
      loadServiceRecords(): void {
        patchState(store, { isLoading: true });
        service.getServiceRecords().subscribe({
          next: (response) => {
            patchState(store, {
              records: response.results.records,
              serviceTypes: response.results.service_types,
              parts: response.results.parts,
              isLoading: false,
            });
          },
          error: () => {
            patchState(store, { isLoading: false });
          },
        });
      },
      createRecord(
        payload: ServiceRecordPayload,
        receiptFiles: File[],
        serviceFiles: File[],
        handlers?: {
          next?: (record: ServiceRecord) => void;
          error?: (error: unknown) => void;
        }
      ): void {
        service.createServiceRecord(payload, receiptFiles, serviceFiles).subscribe({
          next: (response) => {
            this.addRecord(response.results.record);
            handlers?.next?.(response.results.record);
          },
          error: (error) => {
            handlers?.error?.(error);
          },
        });
      },
      updateRecord(
        recordId: number,
        payload: ServiceRecordPayload,
        receiptFiles: File[],
        serviceFiles: File[],
        handlers?: {
          next?: (record: ServiceRecord) => void;
          error?: (error: unknown) => void;
        }
      ): void {
        service.updateServiceRecord(recordId, payload, receiptFiles, serviceFiles).subscribe({
          next: (response) => {
            this.setRecord(response.results.record);
            handlers?.next?.(response.results.record);
          },
          error: (error) => {
            handlers?.error?.(error);
          },
        });
      },
      deleteRecord(
        recordId: number,
        handlers?: {
          next?: () => void;
          error?: (error: unknown) => void;
        }
      ): void {
        service.deleteServiceRecord(recordId).subscribe({
          next: () => {
            this.removeRecord(recordId);
            handlers?.next?.();
          },
          error: (error) => {
            handlers?.error?.(error);
          },
        });
      },
    };
  })
);
