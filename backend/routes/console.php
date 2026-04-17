<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

if (env('VEHICLE_REPORT_USER_EMAIL')) {
    $command = 'report:vehicles --email=' . env('VEHICLE_REPORT_USER_EMAIL');

    if (env('VEHICLE_REPORT_SEND_TO')) {
        $command .= ' --send-to=' . env('VEHICLE_REPORT_SEND_TO');
    }

    if (filter_var(env('VEHICLE_REPORT_DEMO_EVERY_MINUTE', false), FILTER_VALIDATE_BOOLEAN)) {
        Schedule::command($command)->everyMinute();
    } else {
        Schedule::command($command)->weeklyOn(1, '08:00');
    }
}
