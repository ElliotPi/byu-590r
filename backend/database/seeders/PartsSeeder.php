<?php

namespace Database\Seeders;

use App\Models\Part;
use Illuminate\Database\Seeder;

class PartsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $parts = [
            [
                'name' => 'Oil Filter',
                'brand' => 'Bosch',
                'part_number' => 'OF-3321',
                'unit' => 'each',
            ],
            [
                'name' => 'Air Filter',
                'brand' => 'Fram',
                'part_number' => 'AF-120',
                'unit' => 'each',
            ],
            [
                'name' => 'Brake Pads',
                'brand' => 'Akebono',
                'part_number' => 'BP-910',
                'unit' => 'set',
            ],
            [
                'name' => 'Engine Oil',
                'brand' => 'Mobil 1',
                'part_number' => '5W30',
                'unit' => 'quart',
            ],
            [
                'name' => 'Coolant',
                'brand' => 'Prestone',
                'part_number' => 'AF2000',
                'unit' => 'gallon',
            ],
        ];

        foreach ($parts as $part) {
            Part::updateOrCreate(
                ['name' => $part['name'], 'brand' => $part['brand']],
                $part
            );
        }
    }
}
