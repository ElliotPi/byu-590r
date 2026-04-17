<?php

namespace App\Jobs;

use App\Mail\VehiclesMasterList;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendVehicleMasterList implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected int $userId,
        protected string $sendToEmail
    ) {
    }

    public function handle(): void
    {
        $user = User::find($this->userId);

        if (!$user) {
            Log::warning('Vehicle report job skipped because the user could not be found.', [
                'user_id' => $this->userId,
                'send_to' => $this->sendToEmail,
            ]);
            return;
        }

        $vehicles = Vehicle::where('user_id', $user->id)
            ->with('images')
            ->orderBy('name')
            ->get();

        if ($vehicles->isEmpty()) {
            Log::info('Vehicle report job skipped because the user has no vehicles.', [
                'user_id' => $user->id,
                'send_to' => $this->sendToEmail,
            ]);
            return;
        }

        Mail::to($this->sendToEmail)->send(new VehiclesMasterList($user, $vehicles));
    }
}
