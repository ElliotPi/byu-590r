import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VehiclesComponent } from './vehicles.component';
import { VehiclesStore } from '../core/stores/vehicles.store';
import { Vehicle } from '../core/services/vehicles.service';

describe('VehiclesComponent', () => {
  const mockVehicles: Vehicle[] = [
    {
      id: 1,
      user_id: 1,
      name: '2018 Toyota Tacoma TRD Off-Road',
      description: 'Weekend truck',
      year: 2018,
      make: 'Toyota',
      model: 'Tacoma',
      trim: 'TRD Off-Road',
      engine: '3.5L V6',
      vin: 'VIN0001',
      license_plate: 'DIY-101',
      purchase_date: '2022-04-09',
      vehicle_picture: 'https://example.com/tacoma.jpg',
      images: [],
    },
    {
      id: 2,
      user_id: 1,
      name: '2011 Subaru Outback 2.5i',
      description: 'Family car',
      year: 2011,
      make: 'Subaru',
      model: 'Outback',
      trim: '2.5i',
      engine: '2.5L H4',
      vin: 'VIN0002',
      license_plate: 'AWD-225',
      purchase_date: '2021-09-15',
      vehicle_picture: null,
      images: [],
    },
  ];

  const storeMock = {
    vehicleRows: signal<Vehicle[]>(mockVehicles),
    isLoading: signal(false),
    loadVehicles: jasmine.createSpy('loadVehicles'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiclesComponent],
      providers: [{ provide: VehiclesStore, useValue: storeMock }],
    }).compileComponents();
  });

  it('loads vehicles on init', () => {
    const fixture = TestBed.createComponent(VehiclesComponent);
    fixture.detectChanges();

    expect(storeMock.loadVehicles).toHaveBeenCalled();
  });

  it('renders mocked vehicle rows in the table', () => {
    const fixture = TestBed.createComponent(VehiclesComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('2018 Toyota Tacoma TRD Off-Road');
    expect(compiled.textContent).toContain('2011 Subaru Outback 2.5i');
    expect(compiled.textContent).toContain('Weekend truck');
    expect(compiled.textContent).toContain('Family car');
  });

  it('shows a fallback icon when vehicle_picture is missing', () => {
    const fixture = TestBed.createComponent(VehiclesComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('mat-icon').length).toBeGreaterThan(0);
  });
});
