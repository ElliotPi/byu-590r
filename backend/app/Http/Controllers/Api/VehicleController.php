<?php

namespace App\Http\Controllers\Api;

use App\Models\Vehicle;
use App\Models\VehicleImage;
use App\Services\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class VehicleController extends BaseController
{
    public function __construct(
        protected OpenAIService $openAIService
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $authUser = Auth::user();

        $vehicles = Vehicle::with('images')
            ->where('user_id', $authUser->id)
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn (Vehicle $vehicle) => $this->transformVehicle($vehicle));

        return $this->sendResponse($vehicles->values(), 'Vehicles');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'year' => 'required|integer|min:1886|max:' . (date('Y') + 2),
            'make' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'vin' => 'required|string|size:17|unique:vehicles,vin',
            'nickname' => 'nullable|string|max:255',
            'trim' => 'nullable|string|max:255',
            'engine' => 'nullable|string|max:255',
            'license_plate' => 'nullable|string|max:255',
            'purchase_date' => 'nullable|date',
            'file' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors());
        }

        $authUser = Auth::user();

        try {
            $vehicle = DB::transaction(function () use ($request, $authUser) {
                $vehicle = Vehicle::create([
                    'user_id' => $authUser->id,
                    'name' => $request->input('name'),
                    'description' => $request->input('description'),
                    'nickname' => $request->input('nickname'),
                    'year' => $request->input('year'),
                    'make' => $request->input('make'),
                    'model' => $request->input('model'),
                    'trim' => $request->input('trim'),
                    'engine' => $request->input('engine'),
                    'vin' => strtoupper($request->input('vin')),
                    'license_plate' => $request->input('license_plate'),
                    'purchase_date' => $request->input('purchase_date'),
                ]);

                $this->replacePrimaryImage($vehicle, $request);

                return $vehicle->load('images');
            });
        } catch (\Throwable $e) {
            Log::error('Vehicle create failed: ' . $e->getMessage(), ['exception' => $e]);
            return $this->sendError('Vehicle failed to create.', [], 500);
        }

        return $this->sendResponse(
            ['vehicle' => $this->transformVehicle($vehicle)],
            'Vehicle created successfully!'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $id = (string) $request->route('id');
        $vehicle = $this->findOwnedVehicle($id);

        if (!$vehicle) {
            return $this->sendError('Vehicle not found.', [], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'year' => 'required|integer|min:1886|max:' . (date('Y') + 2),
            'make' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'vin' => 'required|string|size:17|unique:vehicles,vin,' . $vehicle->id,
            'nickname' => 'nullable|string|max:255',
            'trim' => 'nullable|string|max:255',
            'engine' => 'nullable|string|max:255',
            'license_plate' => 'nullable|string|max:255',
            'purchase_date' => 'nullable|date',
            'file' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors());
        }

        try {
            $vehicle = DB::transaction(function () use ($request, $vehicle) {
                $vehicle->update([
                    'name' => $request->input('name'),
                    'description' => $request->input('description'),
                    'nickname' => $request->input('nickname'),
                    'year' => $request->input('year'),
                    'make' => $request->input('make'),
                    'model' => $request->input('model'),
                    'trim' => $request->input('trim'),
                    'engine' => $request->input('engine'),
                    'vin' => strtoupper($request->input('vin')),
                    'license_plate' => $request->input('license_plate'),
                    'purchase_date' => $request->input('purchase_date'),
                ]);

                if ($request->hasFile('file')) {
                    $this->replacePrimaryImage($vehicle, $request);
                }

                return $vehicle->load('images');
            });
        } catch (\Throwable $e) {
            Log::error('Vehicle update failed: ' . $e->getMessage(), ['exception' => $e]);
            return $this->sendError('Vehicle failed to update.', [], 500);
        }

        return $this->sendResponse(
            ['vehicle' => $this->transformVehicle($vehicle)],
            'Vehicle updated successfully!'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request)
    {
        $id = (string) $request->route('id');
        $vehicle = $this->findOwnedVehicle($id);

        if (!$vehicle) {
            return $this->sendError('Vehicle not found.', [], 404);
        }

        try {
            DB::transaction(function () use ($vehicle) {
                foreach ($vehicle->images as $image) {
                    $this->deleteImageFromStorage($image);
                    $image->delete();
                }

                $vehicle->delete();
            });
        } catch (\Throwable $e) {
            Log::error('Vehicle delete failed: ' . $e->getMessage(), ['exception' => $e]);
            return $this->sendError('Vehicle failed to delete.', [], 500);
        }

        return $this->sendResponse(
            ['vehicle' => ['id' => (int) $id]],
            'Vehicle deleted successfully!'
        );
    }

    public function generateDescription(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year' => 'required|integer|min:1886|max:' . (date('Y') + 2),
            'make' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'nickname' => 'nullable|string|max:255',
            'trim' => 'nullable|string|max:255',
            'engine' => 'nullable|string|max:255',
            'use_case' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors());
        }

        $result = $this->openAIService->generateVehicleDescription($request->all());

        if (!($result['success'] ?? false)) {
            return $this->sendError($result['message'] ?? 'AI description generation failed.', [], 500);
        }

        return $this->sendResponse(
            [
                'description' => $result['description'],
                'model' => $result['model'] ?? null,
            ],
            'Vehicle description generated successfully!'
        );
    }

    protected function findOwnedVehicle(string $id): ?Vehicle
    {
        $authUser = Auth::user();

        return Vehicle::with('images')
            ->where('user_id', $authUser->id)
            ->whereKey($id)
            ->first();
    }

    protected function transformVehicle(Vehicle $vehicle): Vehicle
    {
        foreach ($vehicle->images as $image) {
            $image->file_url = $this->getS3Url($image->file_path);
        }

        $primaryImage = $vehicle->images->firstWhere('is_primary', true) ?? $vehicle->images->first();
        $vehicle->vehicle_picture = $primaryImage?->file_url;

        return $vehicle;
    }

    protected function replacePrimaryImage(Vehicle $vehicle, Request $request): void
    {
        if (!$request->hasFile('file')) {
            return;
        }

        $existingPrimary = $vehicle->images()->where('is_primary', true)->first();
        $newPath = $this->storeVehicleImage($request);

        if ($existingPrimary) {
            $this->deleteImageFromStorage($existingPrimary);
            $existingPrimary->update([
                'file_path' => $newPath,
                'caption' => $request->input('image_caption', $existingPrimary->caption),
                'sort_order' => 1,
                'is_primary' => true,
            ]);
            return;
        }

        $vehicle->images()->create([
            'file_path' => $newPath,
            'caption' => $request->input('image_caption', 'Primary vehicle cover'),
            'sort_order' => 1,
            'is_primary' => true,
        ]);
    }

    protected function storeVehicleImage(Request $request): string
    {
        $extension = $request->file('file')->getClientOriginalExtension();
        $imageName = time() . '_vehicle_cover.' . $extension;
        $path = $request->file('file')->storeAs('images/vehicles', $imageName, 's3');

        if (!$path) {
            throw new \RuntimeException('Vehicle image upload returned an empty path.');
        }

        try {
            Storage::disk('s3')->setVisibility($path, 'public');
        } catch (\Throwable $e) {
            Log::warning('S3 setVisibility failed for vehicle image (non-fatal): ' . $e->getMessage());
        }

        return $path;
    }

    protected function deleteImageFromStorage(VehicleImage $image): void
    {
        if (!$image->file_path) {
            return;
        }

        try {
            Storage::disk('s3')->delete($image->file_path);
        } catch (\Throwable $e) {
            Log::warning('Failed to delete vehicle image from storage: ' . $e->getMessage());
        }
    }
}
