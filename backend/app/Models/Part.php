<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Part extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'brand',
        'part_number',
        'unit',
    ];

    public function serviceRecords(): BelongsToMany
    {
        return $this->belongsToMany(ServiceRecord::class, 'service_record_parts')
            ->withPivot(['quantity', 'unit_price', 'line_total'])
            ->withTimestamps();
    }
}
