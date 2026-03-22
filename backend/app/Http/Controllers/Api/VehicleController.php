<?php

namespace App\Http\Controllers\Api;

use App\Models\Vehicle;

class VehicleController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $vehicles = Vehicle::with('images')->orderBy('name', 'asc')->get();

        foreach ($vehicles as $vehicle) {
            foreach ($vehicle->images as $image) {
                $image->file_url = $this->getS3Url($image->file_path);
            }

            $primaryImage = $vehicle->images->firstWhere('is_primary', true) ?? $vehicle->images->first();
            $vehicle->vehicle_picture = $primaryImage?->file_url;
        }

        return $this->sendResponse($vehicles, 'Vehicles');
    }
}
