<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'service' => 'Laravel PHP & MySQL Hosting Test App',
        'phpVersion' => PHP_VERSION,
        'environment' => env('APP_ENV', 'production'),
        'timestamp' => date('Y-m-d H:i:s'),
    ]);
});
