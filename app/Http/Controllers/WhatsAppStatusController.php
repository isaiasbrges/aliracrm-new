<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Services\EvolutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppStatusController extends Controller
{
    public function __construct(
        protected EvolutionService $evolutionService
    ) {}

    /**
     * Obter status real da conexão do WhatsApp via Evolution API
     */
    public function getStatus(Request $request): JsonResponse
    {
        $store = $request->attributes->get('store');
        $organizationId = $request->user()->organization_id;
        $storeId = $store->id;

        $instanceName = $store->slug ?? 'dyvinus';
        $status = $this->evolutionService->getConnectionStatus($instanceName);

        // Se falhar e o slug for dyvinuss-looks, tenta com dyvinus
        if (!$status['connected'] && $instanceName !== 'dyvinus') {
            $altStatus = $this->evolutionService->getConnectionStatus('dyvinus');
            if ($altStatus['connected']) {
                $status = $altStatus;
                $instanceName = 'dyvinus';
            }
        }

        // Estatísticas do dia
        $sentToday = Message::query()
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->where('direction', 'outbound')
            ->whereDate('created_at', today())
            ->count();

        $receivedToday = Message::query()
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->where('direction', 'inbound')
            ->whereDate('created_at', today())
            ->count();

        $totalConversations = Conversation::query()
            ->where('organization_id', $organizationId)
            ->where('store_id', $storeId)
            ->count();

        $dailyLimit = 200;
        $hour = (int) now()->format('H');

        return response()->json([
            'success'            => true,
            'instance'           => $instanceName,
            'connected'          => (bool) ($status['connected'] ?? false),
            'state'              => (string) ($status['state'] ?? 'close'),
            'chip_health'        => [
                'dispatches_today'   => $sentToday,
                'received_today'     => $receivedToday,
                'daily_limit'        => $dailyLimit,
                'remaining'          => max(0, $dailyLimit - $sentToday),
                'percentage'         => min(100, (int) round(($sentToday / $dailyLimit) * 100)),
                'status'             => $sentToday < 140 ? 'safe' : ($sentToday < 200 ? 'warning' : 'limit_reached'),
                'is_commercial_hour' => ($hour >= 8 && $hour < 21),
                'current_time'       => now()->format('H:i'),
            ],
            'total_chats'        => $totalConversations,
            'evolution_api_url'  => $this->evolutionService->getBaseUrl(),
        ]);
    }

    /**
     * Obter QR Code ao vivo para conexão do WhatsApp
     */
    public function getQrCode(Request $request): JsonResponse
    {
        $store = $request->attributes->get('store');
        $instanceName = $store->slug ?? 'dyvinus';

        $qrData = $this->evolutionService->getConnectQrCode($instanceName);
        if (!$qrData['success'] && $instanceName !== 'dyvinus') {
            $qrData = $this->evolutionService->getConnectQrCode('dyvinus');
        }

        return response()->json($qrData);
    }
}
