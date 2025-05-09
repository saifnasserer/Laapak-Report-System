<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportNote extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'report_id',
        'note',
        'priority',
    ];

    /**
     * Get the report that owns the note.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * Scope a query to filter by priority.
     */
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Get badge class based on priority
     */
    public function getBadgeClass(): string
    {
        return match($this->priority) {
            'high' => 'bg-danger',
            'medium' => 'bg-warning text-dark',
            'low' => 'bg-info text-dark',
            default => 'bg-secondary',
        };
    }

    /**
     * Get priority label in Arabic
     */
    public function getPriorityLabel(): string
    {
        return match($this->priority) {
            'high' => 'عالية',
            'medium' => 'متوسطة',
            'low' => 'منخفضة',
            default => $this->priority,
        };
    }
}
