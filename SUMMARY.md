# Project Summary (WSL Work Log + IS 542 React Notes)

This file summarizes the key work and decisions from our WSL session so you can continue on Windows. It also includes the IS 542 (React + TypeScript) project notes you asked to preserve.

## BYU 590R (Laravel + Angular) — What We Built

### Milestone 9 (Vehicle CRUD + Image + AI)
Backend:
- Full CRUD in `backend/app/Http/Controllers/Api/VehicleController.php`
  - `store()` requires image upload and saves to S3.
  - `update()` supports optional image replacement in same request.
  - `destroy()` deletes related images from S3 and deletes the vehicle.
  - `index()` returns only vehicles for the logged-in user and resolves S3 URLs.
  - `generateDescription()` calls OpenAI for vehicle description.
- OpenAI integration in `backend/app/Services/OpenAIService.php`
  - Parses Responses API output correctly.
  - Fallback generator now produces varied outputs.
- Vehicle image deletion and transformation built in.
- Routes in `backend/routes/api.php`:
  - `Route::resource('vehicles', ...)` for index/store/update/destroy.
  - `POST /api/vehicles/generate_description`.

Frontend:
- Vehicles service: `web-app/src/app/core/services/vehicles.service.ts`
  - `createVehicle()` uses `FormData` + required file.
  - `updateVehicle()` uses `FormData` + `_method=PUT` (optional file).
  - `deleteVehicle()`, `generateVehicleDescription()`.
- Vehicles store: `web-app/src/app/core/stores/vehicles.store.ts`
  - `loadVehicles`, `createVehicle`, `updateVehicle`, `deleteVehicle`, AI method.
- Vehicles component UI:
  - `web-app/src/app/vehicles/vehicles.component.ts`
  - `web-app/src/app/vehicles/vehicles.component.html`
  - `web-app/src/app/vehicles/vehicles.component.scss`
  - Create/Edit/Delete dialogs, form validation, AI description button.
  - Edit dialog shows current cover image and preview of replacement.
  - Delete dialog has warning text and red destructive button.
  - VIN auto-uppercase; purchase date uses `MM/DD/YYYY`.

Seeder fix (duplicate VIN issue):
- `backend/database/seeders/VehiclesSeeder.php`
  - Uses `Vehicle::withTrashed()->updateOrCreate(...)` and restores soft-deleted rows.

OpenAI working check:
- The service now uses Responses API output parsing and returns `source => openai` when the API succeeds.

### Milestone 11 (Automated Email Report)
Goal: send a weekly vehicle master list email via CLI and scheduler.

Added:
- Mailable: `backend/app/Mail/VehiclesMasterList.php`
- Blade view: `backend/resources/views/mail/vehicle-master-list.blade.php`
- Command: `backend/app/Console/Commands/VehiclesReportCommand.php`
- Job: `backend/app/Jobs/SendVehicleMasterList.php`
- Scheduler hook: `backend/routes/console.php`
  - Weekly default: `weeklyOn(1, '08:00')`
  - Demo toggle: `VEHICLE_REPORT_DEMO_EVERY_MINUTE=true` -> `everyMinute()`

Command usage (must run inside container):
```
docker compose exec -T app php artisan report:vehicles --email=testuser@test.com --send-to=your@email.com
```

Scheduler demo:
```
docker compose exec -T app php artisan queue:work
docker compose exec -T app php artisan schedule:work
```

Env keys used:
```
VEHICLE_REPORT_USER_EMAIL=testuser@test.com
VEHICLE_REPORT_SEND_TO=you@example.com
VEHICLE_REPORT_DEMO_EVERY_MINUTE=true
```
After demo, set `VEHICLE_REPORT_DEMO_EVERY_MINUTE=false` and run:
```
docker compose exec -T app php artisan optimize:clear
```

### Home Page Refresh (DIY Garage Dashboard)
Home page was redesigned to match DIY car maintenance theme.
- `web-app/src/app/home/home.component.ts`
- `web-app/src/app/home/home.component.html`
- `web-app/src/app/home/home.component.scss`

Changes:
- Removed “favorite books” template.
- Added a garage dashboard hero, checklist, and shortcuts.
- Tab title updated in `web-app/src/index.html` to `WrenchLog Garage`.
- Tracked Vehicles metric now reflects actual vehicle count via `VehiclesStore`.
- Open Service Logs metric left as TODO (placeholder).

### Common Local Commands
Run backend inside Docker:
```
cd backend
docker compose exec -T app php artisan migrate
docker compose exec -T app php artisan db:seed --class=VehiclesSeeder
```

Run frontend:
```
cd web-app
npm start
```

### Common Gotchas We Solved
- If you see “mysql host not found,” you ran `php artisan` on host. Use `docker compose exec -T app php artisan ...` when DB_HOST=mysql.
- Vehicles list is scoped to logged-in user. Seeded vehicles belong to `testuser@test.com`.
- When VS Code shows red squiggles in spec files, `npx tsc -p tsconfig.spec.json --noEmit` passed, so it’s likely editor config, not actual errors.

## IS 542 (React + TypeScript) Project Notes

### Project Idea
WrenchLog — a DIY vehicle maintenance tracker for car owners. The app helps users log vehicles, maintenance history, parts, and photos in one place.

### Data Design (Main Entities)
- `User` (id, name, email)
- `UserSettings` (timezone, unit preferences, notification settings)
- `Vehicle` (id, userId, name, description, year, make, model, VIN, etc.)
- `VehicleImage` (vehicleId, filePath, caption, primary flag)
- `ServiceType` (oil change, brake service, etc.)
- `ServiceRecord` (vehicleId, date, mileage, cost, notes, etc.)
- `Part` (name, brand, partNumber)
- `ServiceRecordPart` (junction table between ServiceRecord and Part)
- `Attachment` (service record receipts/files)
- `OdometerLog` (vehicleId, date, mileage)

Relationships:
- User 1:1 UserSettings
- User 1:* Vehicles
- Vehicle 1:* VehicleImages
- Vehicle 1:* ServiceRecords
- Vehicle 1:* OdometerLogs
- ServiceType 1:* ServiceRecords
- ServiceRecord *:* Parts via ServiceRecordPart
- ServiceRecord 1:* Attachments

### Storyboard Summary (React)
Key screens:
1. Login/Register
2. Dashboard (garage overview)
3. Vehicles list
4. Vehicle detail with images
5. Maintenance record list
6. Add Service record form
7. Profile/settings

### API Requirement (IS 542)
Recommended API: NHTSA vPIC for VIN decoding to auto-populate make/model/year.

### UML (Mermaid)
We generated a UML class diagram in Mermaid form for the vehicle maintenance data design (User, Vehicle, ServiceRecord, Part, etc.). If needed, ask to regenerate it for your Windows environment.

## What You Should Move to Windows
- This `SUMMARY.md`
- Your local `.env` values (but do not commit secrets)
- Any notes about demo steps (scheduler, queue worker, email preview)

## Reminder About Secrets
You exposed real API keys and credentials in terminal output during the session. Rotate/revoke:
- OpenAI key
- AWS key
- Gmail App Password

---
If you want an updated summary after additional work, just ask.

