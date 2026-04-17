<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class VehiclesMasterList extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param Collection<int, \App\Models\Vehicle> $vehicles
     */
    public function __construct(
        protected User $user,
        protected Collection $vehicles
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@wrenchlog.local'),
                env('MAIL_FROM_NAME', config('app.name', 'WrenchLog'))
            ),
            subject: 'Your WrenchLog vehicle master list',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.vehicle-master-list',
            with: [
                'appName' => config('app.name', 'WrenchLog'),
                'user' => $this->user,
                'vehicles' => $this->vehicles,
                'generatedAt' => now(),
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
