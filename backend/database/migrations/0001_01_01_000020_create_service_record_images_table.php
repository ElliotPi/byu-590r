<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_record_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_record_id')->constrained('service_records')->cascadeOnDelete();
            $table->string('file_path');
            $table->enum('image_type', ['receipt', 'service']);
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();

            $table->index(['service_record_id', 'image_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_record_images');
    }
};
