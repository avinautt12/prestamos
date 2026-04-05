<?php

return [
    'gerente' => [
        // Cuando está activo, aprobar/rechazar créditos exige que la IP venga de la subred VPN.
        'require_vpn' => env('GERENTE_REQUIRE_VPN', false),
        'wireguard_cidr' => env('GERENTE_WIREGUARD_CIDR', '10.8.0.0/24'),
    ],
];
