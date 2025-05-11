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
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'reports';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'order_number',
        'client_id',
        'device_id',
        'user_id',
        'inspection_date',
        'qr_code_path',
        'pdf_path',
        'whatsapp_sent',
        'whatsapp_sent_at',
        'status'
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'inspection_date' => 'date',
        'whatsapp_sent' => 'boolean',
        'whatsapp_sent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the client that owns the report.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    /**
     * Get the technician (admin) who created the report.
     */
    public function technician(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'user_id');
    }
    
    /**
     * Get the device associated with the report.
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'device_id');
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
     * Generate a unique order code for a new report.
     * Format: LAP-YYYY-XXXX (e.g., LAP-2025-0001)
     *
     * @return string
     */
    public static function generateOrderCode(): string
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
     * Scope a query to filter by order code.
     */
    public function scopeByOrderCode($query, $orderCode)
    {
        return $query->where('order_number', 'like', "%{$orderCode}%");
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
