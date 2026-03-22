<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f7; font-family: Arial, Helvetica, sans-serif; color: #172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eef2f7; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 18px 40px rgba(23, 32, 51, 0.12);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #173b67 0%, #255ea8 100%); padding: 36px 40px; color: #ffffff;">
                            <p style="margin: 0 0 10px; font-size: 12px; letter-spacing: 1.8px; text-transform: uppercase; opacity: 0.78;">
                                Account Recovery
                            </p>
                            <h1 style="margin: 0; font-size: 30px; line-height: 1.2; font-weight: 700;">
                                Reset your password
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 36px 40px 20px;">
                            <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.7;">
                                Hi {{ $user->name }},
                            </p>
                            <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.7; color: #42506a;">
                                We received a request to reset the password for your account. Use the button below to choose a new password and get back in.
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0 24px;">
                                <tr>
                                    <td align="center" style="border-radius: 999px; background-color: #255ea8;">
                                        <a
                                            href="{{ $base_url }}/api/password_reset?remember_token={{ $user->remember_token }}"
                                            style="display: inline-block; padding: 15px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.7; color: #5d6b82;">
                                If the button does not work, open this link:
                            </p>
                            <p style="margin: 0; font-size: 14px; line-height: 1.7; word-break: break-word;">
                                <a
                                    href="{{ $base_url }}/api/password_reset?remember_token={{ $user->remember_token }}"
                                    style="color: #255ea8; text-decoration: none;">
                                    {{ $base_url }}/api/password_reset?remember_token={{ $user->remember_token }}
                                </a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 40px 36px;">
                            <div style="border-top: 1px solid #dde5f0; padding-top: 20px;">
                                <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.7; color: #6c7890;">
                                    If you did not request this, you can ignore this email. Your current password will remain unchanged until you complete a reset.
                                </p>
                                <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #6c7890;">
                                    Sent by {{ $appName ?? config('app.name', 'WrenchLog') }}
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
