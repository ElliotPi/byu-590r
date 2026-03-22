<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Queue\SerializesModels;

class ForgotPassword extends Mailable
{
    use Queueable, SerializesModels;

    protected $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                env('MAIL_FROM_ADDRESS', 'noreply@wrenchlog.local'),
                env('MAIL_FROM_NAME', config('app.name', 'WrenchLog'))
            ),
            subject: 'Reset your WrenchLog password',
        );
    }

    public function content(): Content
    {
        $base_url = env('APP_URL', 'http://127.0.0.1:8000');
        if (env('APP_ENV') === 'local') {
            $base_url = 'http://127.0.0.1:8000';
        }
        return new Content(
            view: 'mail.forgot_password',
            with: [
                'appName' => config('app.name', 'WrenchLog'),
                'base_url' => $base_url,
                'user' => $this->user
            ]
        );
    }
}
