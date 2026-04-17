<?php

namespace Database\Seeders;

use App\Models\ServiceType;
use Illuminate\Database\Seeder;

class ServiceTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'name' => 'Oil Change',
                'category' => 'Fluids',
                'default_interval_miles' => 5000,
                'default_interval_months' => 6,
            ],
            [
                'name' => 'Tire Rotation',
                'category' => 'Tires',
                'default_interval_miles' => 6000,
                'default_interval_months' => 6,
            ],
            [
                'name' => 'Brake Inspection',
                'category' => 'Brakes',
                'default_interval_miles' => 12000,
                'default_interval_months' => 12,
            ],
            [
                'name' => 'Coolant Flush',
                'category' => 'Fluids',
                'default_interval_miles' => 30000,
                'default_interval_months' => 36,
            ],
            [
                'name' => 'Battery Check',
                'category' => 'Electrical',
                'default_interval_miles' => 12000,
                'default_interval_months' => 12,
            ],
        ];

        foreach ($types as $type) {
            ServiceType::updateOrCreate(
                ['name' => $type['name']],
                $type
            );
        }
    }
}
