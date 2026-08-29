<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'image_url')) {
                $table->text('image_url')->nullable()->after('price');
            }
            if (!Schema::hasColumn('products', 'original_price')) {
                $table->decimal('original_price', 12, 2)->nullable()->after('price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'image_url')) {
                $table->dropColumn('image_url');
            }
            if (Schema::hasColumn('products', 'original_price')) {
                $table->dropColumn('original_price');
            }
        });
    }
};
