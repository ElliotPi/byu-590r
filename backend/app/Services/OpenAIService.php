<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OpenAIService
{
    protected $apiKey;
    protected $baseUrl = 'https://api.openai.com/v1';
    protected $model;

    public function __construct()
    {
        $this->apiKey = env('OPENAI_API_KEY');
        $this->model = env('OPENAI_MODEL', 'gpt-5-mini');
    }

    /**
     * Placeholder method for OpenAI integration
     * Replace this with your actual OpenAI service implementation
     */
    public function placeholder(): array
    {
        return [
            'message' => 'OpenAI service placeholder - implement your OpenAI integration here',
            'status' => 'placeholder',
            'api_key_configured' => !empty($this->apiKey)
        ];
    }

    /**
     * Check if OpenAI service is properly configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Get service status
     */
    public function getStatus(): array
    {
        return [
            'service' => 'OpenAI',
            'configured' => $this->isConfigured(),
            'base_url' => $this->baseUrl,
            'has_api_key' => !empty($this->apiKey)
        ];
    }

    /**
     * Generate a concise vehicle description for CRUD dialogs.
     *
     * @param array<string, mixed> $attributes
     */
    public function generateVehicleDescription(array $attributes): array
    {
        $nickname = trim((string) ($attributes['nickname'] ?? ''));
        $year = trim((string) ($attributes['year'] ?? ''));
        $make = trim((string) ($attributes['make'] ?? ''));
        $model = trim((string) ($attributes['model'] ?? ''));
        $trim = trim((string) ($attributes['trim'] ?? ''));
        $engine = trim((string) ($attributes['engine'] ?? ''));
        $useCase = trim((string) ($attributes['use_case'] ?? ''));

        $vehicleLabel = trim(implode(' ', array_filter([$year, $make, $model, $trim])));

        $prompt = implode("\n", [
            'Write a warm, realistic two-sentence vehicle description for a DIY maintenance tracker.',
            'Keep it under 45 words.',
            'Avoid marketing language and do not mention AI.',
            'Mention how the owner uses the vehicle or what maintenance it is ideal for tracking.',
            '',
            'Vehicle details:',
            'Nickname: ' . ($nickname !== '' ? $nickname : 'N/A'),
            'Vehicle: ' . ($vehicleLabel !== '' ? $vehicleLabel : 'N/A'),
            'Engine: ' . ($engine !== '' ? $engine : 'N/A'),
            'Owner use case: ' . ($useCase !== '' ? $useCase : 'General daily driving and maintenance tracking'),
        ]);

        if (!$this->isConfigured()) {
            return [
                'success' => true,
                'description' => $this->buildFallbackVehicleDescription($attributes),
                'model' => null,
                'source' => 'fallback',
            ];
        }

        $response = Http::withToken($this->apiKey)
            ->timeout(30)
            ->post($this->baseUrl . '/responses', [
                'model' => $this->model,
                'input' => $prompt,
            ]);

        if (!$response->successful()) {
            return [
                'success' => true,
                'description' => $this->buildFallbackVehicleDescription($attributes),
                'model' => null,
                'source' => 'fallback',
            ];
        }

        $outputText = $this->extractOutputText($response->json());

        if ($outputText === '') {
            return [
                'success' => true,
                'description' => $this->buildFallbackVehicleDescription($attributes),
                'model' => null,
                'source' => 'fallback',
            ];
        }

        return [
            'success' => true,
            'description' => $outputText,
            'model' => $this->model,
            'source' => 'openai',
        ];
    }

    /**
     * @param array<string, mixed> $response
     */
    protected function extractOutputText(array $response): string
    {
        $directOutput = trim((string) data_get($response, 'output_text', ''));
        if ($directOutput !== '') {
            return $directOutput;
        }

        $outputs = data_get($response, 'output', []);

        if (!is_array($outputs)) {
            return '';
        }

        foreach ($outputs as $item) {
            if (!is_array($item) || ($item['type'] ?? null) !== 'message') {
                continue;
            }

            $content = $item['content'] ?? [];
            if (!is_array($content)) {
                continue;
            }

            foreach ($content as $contentItem) {
                if (!is_array($contentItem) || ($contentItem['type'] ?? null) !== 'output_text') {
                    continue;
                }

                $text = trim((string) ($contentItem['text'] ?? ''));
                if ($text !== '') {
                    return $text;
                }
            }
        }

        return '';
    }

    /**
     * @param array<string, mixed> $attributes
     */
    protected function buildFallbackVehicleDescription(array $attributes): string
    {
        $nickname = trim((string) ($attributes['nickname'] ?? ''));
        $year = trim((string) ($attributes['year'] ?? ''));
        $make = trim((string) ($attributes['make'] ?? ''));
        $model = trim((string) ($attributes['model'] ?? ''));
        $trim = trim((string) ($attributes['trim'] ?? ''));
        $useCase = trim((string) ($attributes['use_case'] ?? ''));

        $vehicleLabel = trim(implode(' ', array_filter([$year, $make, $model, $trim])));
        $vehicleName = $vehicleLabel !== '' ? $vehicleLabel : 'vehicle';
        $vehicleNameLower = strtolower($vehicleName);

        $leadOptions = $nickname !== ''
            ? [
                sprintf('%s is my %s.', $nickname, $vehicleNameLower),
                sprintf('I keep %s, my %s, logged here so its maintenance history stays easy to follow.', $nickname, $vehicleNameLower),
                sprintf('%s is the name I use for this %s in my garage records.', $nickname, $vehicleNameLower),
            ]
            : [
                sprintf('This %s is part of my garage.', $vehicleName),
                sprintf('I use this tracker to stay organized around my %s.', $vehicleNameLower),
                sprintf('This %s has its own maintenance record in my garage.', $vehicleName),
            ];

        $useCaseOptions = $useCase !== ''
            ? [
                sprintf('I use it mainly for %s, so this record helps me stay ahead of routine maintenance and longer-term repairs.', $useCase),
                sprintf('Since it mostly handles %s, I want one place to track service intervals and repair notes.', $useCase),
                sprintf('Because I rely on it for %s, I keep its maintenance details organized here.', $useCase),
            ]
            : [
                'I use this record to stay ahead of routine maintenance and keep a clean service history in one place.',
                'This helps me track regular service, parts changes, and the bigger repairs that come up over time.',
                'I keep everything here so oil changes, inspections, and longer-term maintenance are easy to review later.',
            ];

        return trim(
            $leadOptions[random_int(0, count($leadOptions) - 1)] . ' ' .
            $useCaseOptions[random_int(0, count($useCaseOptions) - 1)]
        );
    }
}
