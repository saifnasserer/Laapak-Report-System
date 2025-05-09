<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalInspection extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'report_id',
        'image_path',
        'description',
        'position',
    ];

    /**
     * Get the report that owns the external inspection.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * Scope a query to filter by position.
     */
    public function scopeByPosition($query, $position)
    {
        return $query->where('position', $position);
    }

    /**
     * Get position label in Arabic
     */
    public function getPositionLabel(): string
    {
        return match($this->position) {
            'front' => 'الواجهة الأمامية',
            'back' => 'الواجهة الخلفية',
            'left' => 'الجانب الأيسر',
            'right' => 'الجانب الأيمن',
            'keyboard' => 'لوحة المفاتيح',
            'screen' => 'الشاشة',
            'bottom' => 'الجزء السفلي',
            'ports' => 'المنافذ',
            default => $this->position,
        };
    }

    /**
     * Get position icon class
     */
    public function getPositionIconClass(): string
    {
        return match($this->position) {
            'front' => 'fas fa-laptop',
            'back' => 'fas fa-laptop',
            'left' => 'fas fa-arrow-left',
            'right' => 'fas fa-arrow-right',
            'keyboard' => 'fas fa-keyboard',
            'screen' => 'fas fa-desktop',
            'bottom' => 'fas fa-arrow-down',
            'ports' => 'fas fa-plug',
            default => 'fas fa-camera',
        };
    }
}
