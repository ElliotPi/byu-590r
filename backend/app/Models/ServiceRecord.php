<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'vehicle_id',
        'service_type_id',
        'performed_at',
        'odometer_miles',
        'is_diy',
        'shop_name',
        'labor_cost',
        'parts_cost',
        'total_cost',
        'notes',
        'receipt_image',
    ];

    protected function casts(): array
    {
        return [
            'performed_at' => 'date',
            'is_diy' => 'boolean',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function serviceType(): BelongsTo
    {
        return $this->belongsTo(ServiceType::class);
    }

    public function parts(): BelongsToMany
    {
        return $this->belongsToMany(Part::class, 'service_record_parts')
            ->withPivot(['quantity', 'unit_price', 'line_total'])
            ->withTimestamps();
    }

    public function note(): HasOne
    {
        return $this->hasOne(ServiceRecordNote::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ServiceRecordImage::class)->orderBy('sort_order')->orderBy('id');
    }
}
