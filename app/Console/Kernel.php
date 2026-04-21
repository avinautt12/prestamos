<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('traspasos:expirar-codigos')->everyTenMinutes()->withoutOverlapping();
        $schedule->command('app:detectar-distribuidoras-morosas')->daily()->at('00:05')->withoutOverlapping();

        // Reportes ejecutivos
        $schedule->command('reportes:periodicos', ['--tipo' => 'mensual'])
            ->monthlyOn(1, '07:00')
            ->withoutOverlapping();
        $schedule->command('reportes:periodicos', ['--tipo' => 'anual'])
            ->yearlyOn(1, 1, '07:00')
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
