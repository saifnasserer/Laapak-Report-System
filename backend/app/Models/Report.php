<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class Report extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'order_number',
        'client_id',
        'device_id',
        'user_id',
        'inspection_date',
        'qr_code_path',
        'pdf_path',
        'whatsapp_sent',
        'whatsapp_sent_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'inspection_date' => 'date',
        'whatsapp_sent_at' => 'datetime',
        'whatsapp_sent' => 'boolean',
    ];

    /**
     * Get the client that owns the report.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the device that the report is for.
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Get the user who created the report.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the component tests for the report.
     */
    public function componentTests(): HasMany
    {
        return $this->hasMany(ComponentTest::class);
    }

    /**
     * Get the external inspections for the report.
     */
    public function externalInspections(): HasMany
    {
        return $this->hasMany(ExternalInspection::class);
    }

    /**
     * Get the notes for the report.
     */
    public function notes(): HasMany
    {
        return $this->hasMany(ReportNote::class);
    }

    /**
     * Generate a unique order number for a new report.
     * Format: LAP-YYYY-XXXX (e.g., LAP-2025-0001)
     *
     * @return string
     */
    public static function generateOrderNumber(): string
    {
        $year = date('Y');
        $latestReport = self::where('order_number', 'like', "LAP-{$year}-%")
            ->orderBy('id', 'desc')
            ->first();

        $sequence = 1;
        if ($latestReport) {
            $parts = explode('-', $latestReport->order_number);
            $sequence = (int)end($parts) + 1;
        }

        return "LAP-{$year}-" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate QR code for the report
     *
     * @return string The path to the generated QR code
     */
    public function generateQrCode(): string
    {
        $url = url("/report/{$this->order_number}");
        $path = "qrcodes/{$this->order_number}.png";
        $fullPath = storage_path("app/public/{$path}");

        // Ensure the directory exists
        if (!file_exists(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        QrCode::format('png')
            ->size(300)
            ->color(10, 175, 84) // Using our brand color #0eaf54
            ->generate($url, $fullPath);

        $this->update(['qr_code_path' => $path]);

        return $path;
    }

    /**
     * Get public URL for the report
     *
     * @return string
     */
    public function getPublicUrl(): string
    {
        return url("/report/{$this->order_number}");
    }

    /**
     * Mark report as sent via WhatsApp
     *
     * @return void
     */
    public function markAsSent(): void
    {
        $this->update([
            'whatsapp_sent' => true,
            'whatsapp_sent_at' => now(),
        ]);
    }

    /**
     * Scope a query to filter by order number.
     */
    public function scopeByOrderNumber($query, $orderNumber)
    {
        return $query->where('order_number', 'like', "%{$orderNumber}%");
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('inspection_date', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by client.
     */
    public function scopeByClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }
}
