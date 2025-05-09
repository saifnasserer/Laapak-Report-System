<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'model',
        'brand',
        'serial_number',
        'processor',
        'ram',
        'storage',
        'gpu',
        'battery',
        'additional_details',
    ];

    /**
     * Get the reports associated with the device.
     */
    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    /**
     * Scope a query to search by serial number.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $serial
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeBySerial($query, $serial)
    {
        return $query->where('serial_number', 'like', "%{$serial}%");
    }

    /**
     * Scope a query to filter by brand.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $brand
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByBrand($query, $brand)
    {
        return $query->where('brand', $brand);
    }

    /**
     * Scope a query to filter by model.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $model
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByModel($query, $model)
    {
        return $query->where('model', 'like', "%{$model}%");
    }
}
