<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            if (!Schema::hasColumn('stores', 'external_pos_webhook_enabled')) {
                $table->boolean('external_pos_webhook_enabled')->default(false)->after('logo_url');
            }
            if (!Schema::hasColumn('stores', 'external_pos_webhook_url')) {
                $table->text('external_pos_webhook_url')->nullable()->after('external_pos_webhook_enabled');
            }
            if (!Schema::hasColumn('stores', 'external_pos_webhook_secret')) {
                $table->string('external_pos_webhook_secret')->nullable()->after('external_pos_webhook_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            if (Schema::hasColumn('stores', 'external_pos_webhook_enabled')) {
                $table->dropColumn('external_pos_webhook_enabled');
            }
            if (Schema::hasColumn('stores', 'external_pos_webhook_url')) {
                $table->dropColumn('external_pos_webhook_url');
            }
            if (Schema::hasColumn('stores', 'external_pos_webhook_secret')) {
                $table->dropColumn('external_pos_webhook_secret');
            }
        });
    }
};
