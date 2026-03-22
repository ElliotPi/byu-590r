<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Temporary Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f7; font-family: Arial, Helvetica, sans-serif; color: #172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eef2f7; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 18px 40px rgba(23, 32, 51, 0.12);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #12304f 0%, #1f7a63 100%); padding: 36px 40px; color: #ffffff;">
                            <p style="margin: 0 0 10px; font-size: 12px; letter-spacing: 1.8px; text-transform: uppercase; opacity: 0.78;">
                                Password Reset Complete
                            </p>
                            <h1 style="margin: 0; font-size: 30px; line-height: 1.2; font-weight: 700;">
                                Your temporary password is ready
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 36px 40px 20px;">
                            <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.7; color: #42506a;">
                                A new temporary password has been generated for your account. Use it to sign in, then change it immediately to something only you know.
                            </p>
                            <div style="margin: 28px 0; padding: 20px 22px; border-radius: 14px; background-color: #f3f7fb; border: 1px solid #dbe6f3;">
                                <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 1.4px; text-transform: uppercase; color: #61708a;">
                                    Temporary Password
                                </p>
                                <p style="margin: 0; font-size: 24px; font-weight: 700; line-height: 1.4; color: #173b67; word-break: break-word;">
                                    {{ $newPassword }}
                                </p>
                            </div>
                            <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #42506a;">
                                For security, do not share this password. After logging in, update it right away from your account settings.
                            </p>
                            <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #61708a;">
                                Sent by {{ $appName ?? config('app.name', 'WrenchLog') }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 40px 36px;">
                            <div style="border-top: 1px solid #dde5f0; padding-top: 20px;">
                                <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #6c7890;">
                                    If you did not request a password reset, review your account activity as soon as possible.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
