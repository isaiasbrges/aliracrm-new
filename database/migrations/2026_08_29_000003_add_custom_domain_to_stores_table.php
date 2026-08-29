<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            if (!Schema::hasColumn('stores', 'custom_domain')) {
                $table->string('custom_domain')->nullable()->after('slug');
            }
            if (!Schema::hasColumn('stores', 'custom_domain_status')) {
                $table->string('custom_domain_status')->default('pending')->after('custom_domain');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['custom_domain', 'custom_domain_status']);
        });
    }
};
