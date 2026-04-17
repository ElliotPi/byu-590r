<div style="font-family: Arial, sans-serif; color: #1f2937;">
    <h2 style="margin-bottom: 8px;">{{ $appName }} Vehicle Master List</h2>
    <p style="margin-top: 0;">
        Hello {{ $user->name }}, here is your current vehicle list as of
        {{ $generatedAt->format('F j, Y g:i A') }}.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
            <tr style="background: #0f355b; color: white;">
                <th style="padding: 12px; text-align: left;">Vehicle</th>
                <th style="padding: 12px; text-align: left;">Nickname</th>
                <th style="padding: 12px; text-align: left;">VIN</th>
                <th style="padding: 12px; text-align: left;">License Plate</th>
                <th style="padding: 12px; text-align: left;">Photos</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($vehicles as $vehicle)
                <tr style="border-bottom: 1px solid #d1d5db;">
                    <td style="padding: 12px;">
                        <strong>{{ $vehicle->year }} {{ $vehicle->make }} {{ $vehicle->model }}</strong><br>
                        <span style="color: #4b5563;">{{ $vehicle->description }}</span>
                    </td>
                    <td style="padding: 12px;">{{ $vehicle->nickname ?: '—' }}</td>
                    <td style="padding: 12px;">{{ $vehicle->vin }}</td>
                    <td style="padding: 12px;">{{ $vehicle->license_plate ?: '—' }}</td>
                    <td style="padding: 12px;">{{ $vehicle->images->count() }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
