<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id', 'store_id', 'name', 'whatsapp', 'email',
        'city', 'state', 'status', 'whatsapp_consent',
    ];

    protected function casts(): array
    {
        return [
            'whatsapp_consent' => 'boolean',
            'total_spent' => 'decimal:2',
            'last_purchase_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function getAverageTicketAttribute(): float
    {
        if ($this->total_purchases === 0) {
            return 0.0;
        }

        return round((float) $this->total_spent / $this->total_purchases, 2);
    }

    public function getSegmentAttribute(): array
    {
        if ($this->total_purchases === 0) {
            return [
                'label' => 'Novo Lead',
                'badge' => 'badge-info',
                'icon' => '🌱',
            ];
        }

        if ((float) $this->total_spent >= 500 || $this->total_purchases >= 3) {
            return [
                'label' => 'VIP',
                'badge' => 'badge-vip',
                'icon' => '🌟',
            ];
        }

        if ($this->last_purchase_at && $this->last_purchase_at->diffInDays(now()) > 30) {
            return [
                'label' => 'Em Risco (+30d)',
                'badge' => 'badge-warning',
                'icon' => '⚠️',
            ];
        }

        return [
            'label' => 'Recorrente',
            'badge' => 'badge-success',
            'icon' => '🔄',
        ];
    }
}
