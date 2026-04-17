<?php

namespace App\Http\Controllers\Api;

use App\Models\Part;
use App\Models\ServiceRecord;
use App\Models\ServiceRecordNote;
use App\Models\ServiceType;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ServiceRecordController extends BaseController
{
    protected const RECEIPT_FOLDER = 'images/service-receipts';
    protected const SERVICE_FOLDER = 'images/service-photos';

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $authUser = Auth::user();

        $records = ServiceRecord::with(['vehicle', 'serviceType', 'parts', 'note', 'images'])
            ->whereHas('vehicle', function ($query) use ($authUser) {
                $query->where('user_id', $authUser->id);
            })
            ->orderByDesc('performed_at')
            ->get();

        foreach ($records as $record) {
            $this->transformRecordImages($record);
        }

        $serviceTypes = ServiceType::orderBy('name')->get();
        $parts = Part::orderBy('name')->get();

        return $this->sendResponse(
            [
                'records' => $records,
                'service_types' => $serviceTypes,
                'parts' => $parts,
            ],
            'Service records'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'required|integer|exists:vehicles,id',
            'service_type_id' => 'required|integer|exists:service_types,id',
            'performed_at' => 'required|date',
            'odometer_miles' => 'required|integer|min:0',
            'is_diy' => 'required|boolean',
            'shop_name' => 'nullable|string|max:255',
            'labor_cost' => 'nullable|numeric|min:0',
            'parts_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:2000',
            'note' => 'required|string|max:2000',
            'part_ids' => 'required|array|min:1',
            'part_ids.*' => 'integer|exists:parts,id',
            'part_quantities' => 'nullable|array',
            'part_quantities.*' => 'integer|min:1',
            'receipt_files' => 'required|array|min:1',
            'receipt_files.*' => 'file|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'service_files' => 'nullable|array',
            'service_files.*' => 'file|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $authUser = Auth::user();
        $vehicle = Vehicle::where('user_id', $authUser->id)->whereKey($request->input('vehicle_id'))->first();

        if (!$vehicle) {
            return $this->sendError('Vehicle not found for current user.', [], 404);
        }

        try {
            $record = DB::transaction(function () use ($request, $vehicle) {
                $laborCost = (float) $request->input('labor_cost', 0);
                $partsCost = (float) $request->input('parts_cost', 0);

                $record = ServiceRecord::create([
                    'vehicle_id' => $vehicle->id,
                    'service_type_id' => $request->input('service_type_id'),
                    'performed_at' => $request->input('performed_at'),
                    'odometer_miles' => $request->input('odometer_miles'),
                    'is_diy' => (bool) $request->input('is_diy'),
                    'shop_name' => $request->input('shop_name'),
                    'labor_cost' => $laborCost,
                    'parts_cost' => $partsCost,
                    'total_cost' => $laborCost + $partsCost,
                    'notes' => $request->input('notes'),
                    'receipt_image' => null,
                ]);

                ServiceRecordNote::create([
                    'service_record_id' => $record->id,
                    'note' => $request->input('note'),
                ]);

                $syncData = $this->buildPartSyncData(
                    $request->input('part_ids', []),
                    $request->input('part_quantities', [])
                );
                $record->parts()->sync($syncData);

                $receiptPaths = $this->storeUploadedImages($request->file('receipt_files', []), self::RECEIPT_FOLDER);
                $this->replaceImagesByType($record, 'receipt', $receiptPaths);

                $servicePaths = $this->storeUploadedImages($request->file('service_files', []), self::SERVICE_FOLDER);
                $this->replaceImagesByType($record, 'service', $servicePaths);

                return $record->load(['vehicle', 'serviceType', 'parts', 'note', 'images']);
            });
        } catch (\Throwable $e) {
            Log::error('Service record create failed: ' . $e->getMessage(), ['exception' => $e]);
            return $this->sendError('Service record failed to create.', [], 500);
        }

        $this->transformRecordImages($record);

        return $this->sendResponse(
            ['record' => $record],
            'Service record created successfully!'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $id = (string) $request->route('id');
        $record = $this->findOwnedRecord($id);

        if (!$record) {
            return $this->sendError('Service record not found.', [], 404);
        }

        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'required|integer|exists:vehicles,id',
            'service_type_id' => 'required|integer|exists:service_types,id',
            'performed_at' => 'required|date',
            'odometer_miles' => 'required|integer|min:0',
            'is_diy' => 'required|boolean',
            'shop_name' => 'nullable|string|max:255',
            'labor_cost' => 'nullable|numeric|min:0',
            'parts_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:2000',
            'note' => 'required|string|max:2000',
            'part_ids' => 'required|array|min:1',
            'part_ids.*' => 'integer|exists:parts,id',
            'part_quantities' => 'nullable|array',
            'part_quantities.*' => 'integer|min:1',
            'receipt_files' => 'nullable|array|min:1',
            'receipt_files.*' => 'file|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'service_files' => 'nullable|array|min:1',
            'service_files.*' => 'file|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $authUser = Auth::user();
        $vehicle = Vehicle::where('user_id', $authUser->id)->whereKey($request->input('vehicle_id'))->first();

        if (!$vehicle) {
            return $this->sendError('Vehicle not found for current user.', [], 404);
        }

        try {
            $record = DB::transaction(function () use ($request, $record, $vehicle) {
                $laborCost = (float) $request->input('labor_cost', 0);
                $partsCost = (float) $request->input('parts_cost', 0);

                $record->update([
                    'vehicle_id' => $vehicle->id,
                    'service_type_id' => $request->input('service_type_id'),
                    'performed_at' => $request->input('performed_at'),
                    'odometer_miles' => $request->input('odometer_miles'),
                    'is_diy' => (bool) $request->input('is_diy'),
                    'shop_name' => $request->input('shop_name'),
                    'labor_cost' => $laborCost,
                    'parts_cost' => $partsCost,
                    'total_cost' => $laborCost + $partsCost,
                    'notes' => $request->input('notes'),
                ]);

                if ($record->note) {
                    $record->note->update(['note' => $request->input('note')]);
                } else {
                    ServiceRecordNote::create([
                        'service_record_id' => $record->id,
                        'note' => $request->input('note'),
                    ]);
                }

                $syncData = $this->buildPartSyncData(
                    $request->input('part_ids', []),
                    $request->input('part_quantities', [])
                );
                $record->parts()->sync($syncData);

                if ($request->hasFile('receipt_files')) {
                    $receiptPaths = $this->storeUploadedImages($request->file('receipt_files', []), self::RECEIPT_FOLDER);
                    $this->replaceImagesByType($record, 'receipt', $receiptPaths);
                }

                if ($request->hasFile('service_files')) {
                    $servicePaths = $this->storeUploadedImages($request->file('service_files', []), self::SERVICE_FOLDER);
                    $this->replaceImagesByType($record, 'service', $servicePaths);
                }

                return $record->load(['vehicle', 'serviceType', 'parts', 'note', 'images']);
            });
        } catch (\Throwable $e) {
            Log::error('Service record update failed: ' . $e->getMessage(), ['exception' => $e]);
            return $this->sendError('Service record failed to update.', [], 500);
        }

        $this->transformRecordImages($record);

        return $this->sendResponse(
            ['record' => $record],
            'Service record updated successfully!'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request)
    {
        $id = (string) $request->route('id');
        $record = $this->findOwnedRecord($id);

        if (!$record) {
            return $this->sendError('Service record not found.', [], 404);
        }

        try {
            DB::transaction(function () use ($record) {
                $this->deleteRecordImages($record);
                $record->parts()->detach();
                $record->note()?->delete();
                $record->forceDelete();
            });
        } catch (\Throwable $e) {
            Log::error('Service record delete failed: ' . $e->getMessage(), ['exception' => $e]);
            return $this->sendError('Service record failed to delete.', [], 500);
        }

        return $this->sendResponse(
            ['record' => ['id' => (int) $id]],
            'Service record deleted successfully!'
        );
    }

    protected function findOwnedRecord(string $id): ?ServiceRecord
    {
        $authUser = Auth::user();

        return ServiceRecord::with(['vehicle', 'serviceType', 'parts', 'note', 'images'])
            ->whereHas('vehicle', function ($query) use ($authUser) {
                $query->where('user_id', $authUser->id);
            })
            ->whereKey($id)
            ->first();
    }

    /**
     * @param array<int, \Illuminate\Http\UploadedFile> $files
     * @return array<int, string>
     */
    protected function storeUploadedImages(array $files, string $folder): array
    {
        $paths = [];
        foreach ($files as $index => $file) {
            $extension = $file->getClientOriginalExtension();
            $imageName = time() . '_' . $index . '_' . uniqid() . '.' . $extension;

            $path = $file->storeAs($folder, $imageName, 's3');
            if (!$path) {
                throw new \RuntimeException('Image failed to upload');
            }

            try {
                Storage::disk('s3')->setVisibility($path, 'public');
            } catch (\Throwable $e) {
                Log::warning('S3 setVisibility failed (non-fatal): ' . $e->getMessage());
            }

            $paths[] = $path;
        }

        return $paths;
    }

    /**
     * @param array<int, string> $paths
     */
    protected function replaceImagesByType(ServiceRecord $record, string $imageType, array $paths): void
    {
        $existingImages = $record->images()->where('image_type', $imageType)->get();
        foreach ($existingImages as $image) {
            try {
                Storage::disk('s3')->delete($image->file_path);
            } catch (\Throwable $e) {
                Log::warning('Image delete failed: ' . $e->getMessage());
            }
            $image->delete();
        }

        foreach ($paths as $index => $path) {
            $record->images()->create([
                'file_path' => $path,
                'image_type' => $imageType,
                'sort_order' => $index + 1,
            ]);
        }

        if ($imageType === 'receipt') {
            $record->receipt_image = $paths[0] ?? null;
            $record->save();
        }
    }

    protected function deleteRecordImages(ServiceRecord $record): void
    {
        foreach ($record->images as $image) {
            try {
                Storage::disk('s3')->delete($image->file_path);
            } catch (\Throwable $e) {
                Log::warning('Image delete failed: ' . $e->getMessage());
            }
            $image->delete();
        }
    }

    protected function transformRecordImages(ServiceRecord $record): void
    {
        $receiptImages = [];
        $serviceImages = [];

        foreach ($record->images as $image) {
            $payload = [
                'id' => $image->id,
                'file_path' => $image->file_path,
                'file_url' => $this->getS3Url($image->file_path),
                'sort_order' => $image->sort_order,
            ];

            if ($image->image_type === 'receipt') {
                $receiptImages[] = $payload;
            }

            if ($image->image_type === 'service') {
                $serviceImages[] = $payload;
            }
        }

        usort($receiptImages, fn ($a, $b) => ($a['sort_order'] <=> $b['sort_order']));
        usort($serviceImages, fn ($a, $b) => ($a['sort_order'] <=> $b['sort_order']));

        // Backward compatibility: old records may only have receipt_image and no child rows yet.
        if (empty($receiptImages) && !empty($record->receipt_image)) {
            $legacyUrl = $this->getS3Url($record->receipt_image);
            if ($legacyUrl) {
                $receiptImages[] = [
                    'id' => 0,
                    'file_path' => $record->receipt_image,
                    'file_url' => $legacyUrl,
                    'sort_order' => 1,
                ];
            }
        }

        $record->receipt_images = $receiptImages;
        $record->service_images = $serviceImages;
        $record->receipt_image_url = $receiptImages[0]['file_url'] ?? null;
    }

    /**
     * @param array<int, mixed> $partIds
     * @param array<int, mixed> $quantities
     * @return array<int, array<string, int|float|null>>
     */
    protected function buildPartSyncData(array $partIds, array $quantities): array
    {
        $syncData = [];
        foreach ($partIds as $index => $partId) {
            $qty = (int) ($quantities[$index] ?? 1);
            if ($qty < 1) {
                $qty = 1;
            }
            $syncData[$partId] = [
                'quantity' => $qty,
                'unit_price' => null,
                'line_total' => null,
            ];
        }

        return $syncData;
    }
}
