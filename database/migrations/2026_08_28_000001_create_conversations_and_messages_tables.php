<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('channel')->default('whatsapp');
            $table->string('external_chat_id');
            $table->string('status')->default('open')->index();
            $table->string('priority')->default('normal');
            $table->string('subject')->nullable();
            $table->text('last_message_preview')->nullable();
            $table->timestamp('last_message_at')->nullable()->index();
            $table->unsignedInteger('unread_count')->default(0);
            $table->timestamps();
            $table->unique(['organization_id', 'store_id', 'channel', 'external_chat_id']);
            $table->index(['organization_id', 'store_id', 'status', 'last_message_at']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('external_id')->nullable();
            $table->string('direction');
            $table->string('type')->default('text');
            $table->longText('body')->nullable();
            $table->string('status')->default('received');
            $table->string('from_phone')->nullable();
            $table->string('to_phone')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->unique(['conversation_id', 'external_id']);
            $table->index(['organization_id', 'conversation_id', 'created_at']);
            $table->index(['organization_id', 'status']);
        });

        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider')->default('evolution_api');
            $table->string('instance')->nullable();
            $table->string('event_name');
            $table->string('external_id')->nullable();
            $table->json('payload');
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'instance', 'event_name', 'external_id']);
            $table->index(['provider', 'event_name', 'processed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
