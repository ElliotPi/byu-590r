<?php

namespace App\Console\Commands;

use App\Jobs\SendVehicleMasterList;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Console\Command;

class VehiclesReportCommand extends Command
{
    protected $signature = 'report:vehicles {--email= : User email whose vehicles should be included} {--send-to= : Optional destination email address override}';

    protected $description = 'Queue a vehicle master list report for a specific user';

    public function handle(): int
    {
        $userEmail = $this->option('email');
        $sendToEmail = $this->option('send-to') ?: $userEmail;

        if (!$userEmail) {
            $this->error('The --email option is required.');
            return Command::FAILURE;
        }

        $user = User::where('email', $userEmail)->first();

        if (!$user) {
            $this->error("No user found with email {$userEmail}.");
            return Command::FAILURE;
        }

        $vehicles = Vehicle::where('user_id', $user->id)
            ->with('images')
            ->orderBy('name')
            ->get();

        if ($vehicles->isEmpty()) {
            $this->warn("No vehicles found for {$userEmail}.");
            return Command::SUCCESS;
        }

        SendVehicleMasterList::dispatch($user->id, $sendToEmail);
        $this->info("Vehicle report job queued successfully for {$sendToEmail}.");

        return Command::SUCCESS;
    }
}
