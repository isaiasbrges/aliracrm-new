<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deal extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'store_id',
        'customer_id',
        'user_id',
        'title',
        'value',
        'stage',
        'priority',
        'notes',
        'expected_close_date',
        'won_at',
        'lost_at',
        'lost_reason',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'expected_close_date' => 'date',
        'won_at' => 'datetime',
        'lost_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getStageLabelAttribute(): string
    {
        return match ($this->stage) {
            'lead' => 'Novo Lead',
            'contacted' => 'Contato Feito',
            'proposal' => 'Proposta',
            'negotiation' => 'Negociação',
            'won' => 'Ganho / Fechado',
            'lost' => 'Perdido',
            default => ucfirst($this->stage),
        };
    }
}
