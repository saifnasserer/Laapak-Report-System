<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComponentTest extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'report_id',
        'component_type',
        'test_purpose',
        'test_result',
        'screenshot_path',
        'notes',
    ];

    /**
     * Get the report that owns the test.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * Scope a query to filter by component type.
     */
    public function scopeByComponentType($query, $type)
    {
        return $query->where('component_type', $type);
    }

    /**
     * Scope a query to filter by test result.
     */
    public function scopeByTestResult($query, $result)
    {
        return $query->where('test_result', $result);
    }

    /**
     * Get the icon class for this component type
     */
    public function getIconClass(): string
    {
        return match($this->component_type) {
            'CPU' => 'fas fa-microchip',
            'GPU' => 'fas fa-tv',
            'RAM' => 'fas fa-memory',
            'Storage' => 'fas fa-hdd',
            'Battery' => 'fas fa-battery-three-quarters',
            'Keyboard' => 'fas fa-keyboard',
            'Screen' => 'fas fa-desktop',
            'Ports' => 'fas fa-plug',
            'Fans' => 'fas fa-fan',
            'Camera' => 'fas fa-camera',
            'Microphone' => 'fas fa-microphone',
            default => 'fas fa-laptop-medical',
        };
    }

    /**
     * Get the badge class for this test result
     */
    public function getBadgeClass(): string
    {
        return match($this->test_result) {
            'pass' => 'bg-success',
            'warning' => 'bg-warning text-dark',
            'fail' => 'bg-danger',
            default => 'bg-secondary',
        };
    }

    /**
     * Get the badge icon for this test result
     */
    public function getBadgeIcon(): string
    {
        return match($this->test_result) {
            'pass' => '✓',
            'warning' => '⚠️',
            'fail' => '❌',
            default => '?',
        };
    }

    /**
     * Get the badge text for this test result
     */
    public function getBadgeText(): string
    {
        return match($this->test_result) {
            'pass' => 'ممتاز',
            'warning' => 'به ملاحظات',
            'fail' => 'مرفوض',
            default => 'غير معروف',
        };
    }
}
