<?php

namespace Database\Seeders;

use App\Models\Part;
use App\Models\ServiceRecord;
use App\Models\ServiceRecordNote;
use App\Models\ServiceType;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class ServiceRecordsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vehicle = Vehicle::orderBy('id')->first();
        if (!$vehicle) {
            return;
        }

        $oilChange = ServiceType::where('name', 'Oil Change')->first();
        $tireRotation = ServiceType::where('name', 'Tire Rotation')->first();
        $brakeInspection = ServiceType::where('name', 'Brake Inspection')->first();

        $oilFilter = Part::where('name', 'Oil Filter')->first();
        $engineOil = Part::where('name', 'Engine Oil')->first();
        $airFilter = Part::where('name', 'Air Filter')->first();
        $brakePads = Part::where('name', 'Brake Pads')->first();

        $records = [
            [
                'service_type_id' => $oilChange?->id,
                'performed_at' => now()->subMonths(2)->toDateString(),
                'odometer_miles' => 84210,
                'is_diy' => true,
                'shop_name' => null,
                'labor_cost' => 0,
                'parts_cost' => 38.50,
                'notes' => 'Synthetic blend with new filter.',
                'note' => 'Checked drain plug gasket and torqued to spec.',
                'parts' => [$oilFilter?->id, $engineOil?->id],
            ],
            [
                'service_type_id' => $tireRotation?->id,
                'performed_at' => now()->subMonths(4)->toDateString(),
                'odometer_miles' => 81200,
                'is_diy' => true,
                'shop_name' => null,
                'labor_cost' => 0,
                'parts_cost' => 0,
                'notes' => 'Cross rotated and checked pressures.',
                'note' => 'Front left had 2 PSI low, corrected.',
                'parts' => [$airFilter?->id],
            ],
            [
                'service_type_id' => $brakeInspection?->id,
                'performed_at' => now()->subMonths(6)->toDateString(),
                'odometer_miles' => 78050,
                'is_diy' => false,
                'shop_name' => 'Autocare West',
                'labor_cost' => 65,
                'parts_cost' => 120,
                'notes' => 'Front pads at 5mm, rear at 7mm.',
                'note' => 'Plan pad replacement at next service.',
                'parts' => [$brakePads?->id],
            ],
        ];

        foreach ($records as $data) {
            if (!$data['service_type_id']) {
                continue;
            }

            $record = ServiceRecord::withTrashed()->updateOrCreate(
                [
                    'vehicle_id' => $vehicle->id,
                    'service_type_id' => $data['service_type_id'],
                    'performed_at' => $data['performed_at'],
                ],
                [
                    'odometer_miles' => $data['odometer_miles'],
                    'is_diy' => $data['is_diy'],
                    'shop_name' => $data['shop_name'],
                    'labor_cost' => $data['labor_cost'],
                    'parts_cost' => $data['parts_cost'],
                    'total_cost' => $data['labor_cost'] + $data['parts_cost'],
                    'notes' => $data['notes'],
                    'receipt_image' => null,
                    'deleted_at' => null,
                ]
            );

            ServiceRecordNote::updateOrCreate(
                ['service_record_id' => $record->id],
                ['note' => $data['note']]
            );

            $parts = array_values(array_filter($data['parts'] ?? []));
            $sync = [];
            foreach ($parts as $partId) {
                $sync[$partId] = ['quantity' => 1, 'unit_price' => null, 'line_total' => null];
            }
            $record->parts()->sync($sync);
        }
    }
}
