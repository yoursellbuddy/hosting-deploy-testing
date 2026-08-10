<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'service' => 'Laravel PHP & PostgreSQL Hosting Test App',
        'phpVersion' => PHP_VERSION,
        'environment' => env('APP_ENV', 'production'),
        'timestamp' => date('Y-m-d H:i:s'),
    ]);
});
