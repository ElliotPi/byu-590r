<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleImage;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class VehiclesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'testuser@test.com')->first() ?? User::query()->first();

        if (!$user) {
            return;
        }

        $vehicles = [
            [
                'name' => '2018 Toyota Tacoma TRD Off-Road',
                'description' => 'My most dependable weekend truck. I use it for camping trips, hauling project materials, and keeping a close eye on suspension and tire wear.',
                'nickname' => 'Tacoma',
                'year' => 2018,
                'make' => 'Toyota',
                'model' => 'Tacoma',
                'trim' => 'TRD Off-Road',
                'engine' => '3.5L V6',
                'vin' => '3TMCZ5AN8JM100001',
                'license_plate' => 'DIY-101',
                'purchase_date' => '2022-04-09',
                'image' => [
                    'file_path' => 'images/vehicles/toyota-tacoma-trd-offroad.jpg',
                    'caption' => 'Front three-quarter view',
                ],
            ],
            [
                'name' => '2011 Subaru Outback 2.5i',
                'description' => 'The family hauler and winter driver. This one is where I track fluid changes, wheel bearings, and preventive maintenance for longer road trips.',
                'nickname' => 'Outback',
                'year' => 2011,
                'make' => 'Subaru',
                'model' => 'Outback',
                'trim' => '2.5i Premium',
                'engine' => '2.5L H4',
                'vin' => '4S4BRBCC3B3310002',
                'license_plate' => 'AWD-225',
                'purchase_date' => '2021-09-15',
                'image' => [
                    'file_path' => 'images/vehicles/subaru-outback-2011.jpg',
                    'caption' => 'Daily driver exterior shot',
                ],
            ],
            [
                'name' => '2025 Lexus ES 350',
                'description' => 'A comfortable daily driver that is great for tracking oil changes, tire rotations, and longer-term preventative maintenance in one clean history.',
                'nickname' => 'Lexus ES',
                'year' => 2025,
                'make' => 'Lexus',
                'model' => 'ES 350',
                'trim' => 'Base',
                'engine' => '3.5L V6',
                'vin' => '58ADZ1B17SU000003',
                'license_plate' => 'LEX-350',
                'purchase_date' => '2025-02-15',
                'image' => [
                    'file_path' => 'images/vehicles/lexus-es-350-2025.jpg',
                    'caption' => 'Front driver-side exterior shot',
                ],
            ],
            [
                'name' => '2019 Ford F-150 XLT',
                'description' => 'The truck I use as a benchmark for documenting towing-related maintenance, brake inspections, and transmission service intervals.',
                'nickname' => 'F-150',
                'year' => 2019,
                'make' => 'Ford',
                'model' => 'F-150',
                'trim' => 'XLT',
                'engine' => '2.7L EcoBoost',
                'vin' => '1FTEW1EP4KFA00004',
                'license_plate' => 'TRK-427',
                'purchase_date' => '2023-06-11',
                'image' => [
                    'file_path' => 'images/vehicles/ford-f150-xlt-2019.jpg',
                    'caption' => 'Truck parked in driveway',
                ],
            ],
            [
                'name' => '2015 Mazda 3 Touring',
                'description' => 'A fuel-efficient car that I use for tracking tire rotations, cabin filters, and the kind of maintenance most daily drivers need regularly.',
                'nickname' => 'Mazda3',
                'year' => 2015,
                'make' => 'Mazda',
                'model' => '3',
                'trim' => 'Touring',
                'engine' => '2.0L I4',
                'vin' => 'JM1BM1V75F1230005',
                'license_plate' => 'MZD-315',
                'purchase_date' => '2024-01-20',
                'image' => [
                    'file_path' => 'images/vehicles/mazda-3-touring-2015.jpg',
                    'caption' => 'Compact sedan front view',
                ],
            ],
        ];

        foreach ($vehicles as $vehicleData) {
            $imageData = $vehicleData['image'];
            unset($vehicleData['image']);

            $vehicle = Vehicle::updateOrCreate(
                ['vin' => $vehicleData['vin']],
                [
                    ...$vehicleData,
                    'user_id' => $user->id,
                    'purchase_date' => Carbon::parse($vehicleData['purchase_date']),
                ]
            );

            VehicleImage::updateOrCreate(
                [
                    'vehicle_id' => $vehicle->id,
                    'file_path' => $imageData['file_path'],
                ],
                [
                    'caption' => $imageData['caption'],
                    'sort_order' => 1,
                    'is_primary' => true,
                ]
            );
        }
    }
}
