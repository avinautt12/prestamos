<?php

namespace App\Http\Middleware;

use App\Models\Usuario;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureGerenteSecureAction
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Usuario|null $usuario */
        $usuario = $request->user();

        if (!$usuario || !$usuario->tieneRol('GERENTE')) {
            return $next($request);
        }

        $requiresVpn = (bool) config('security.gerente.require_vpn', false);
        if (!$requiresVpn) {
            return $next($request);
        }

        $requestIp = (string) $request->ip();
        $allowedCidr = (string) config('security.gerente.wireguard_cidr', '10.8.0.0/32');

        if ($this->ipInCidr($requestIp, $allowedCidr)) {
            return $next($request);
        }

        return back()->withErrors([
            'security' => 'Acción bloqueada: para aprobar o rechazar créditos debes estar conectado por VPN WireGuard (nodo S3).',
        ]);
    }

    private function ipInCidr(string $ip, string $cidr): bool
    {
        if ($ip === '' || $cidr === '' || !str_contains($cidr, '/')) {
            return false;
        }

        [$subnet, $maskBits] = explode('/', $cidr, 2);

        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return false;
        }

        if (!filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return false;
        }

        $maskBitsInt = (int) $maskBits;
        if ($maskBitsInt < 0 || $maskBitsInt > 32) {
            return false;
        }

        $ipLong = ip2long($ip);
        $subnetLong = ip2long($subnet);

        if ($ipLong === false || $subnetLong === false) {
            return false;
        }

        $mask = $maskBitsInt === 0 ? 0 : (~0 << (32 - $maskBitsInt));

        return (($ipLong & $mask) === ($subnetLong & $mask));
    }
}
