<?php

return [
    'gerente' => [
        // Cuando está activo, aprobar/rechazar créditos exige que la IP venga de la subred VPN.
        'require_vpn' => env('GERENTE_REQUIRE_VPN', true),
        'wireguard_cidr' => env('GERENTE_WIREGUARD_CIDR', '10.8.0.0/32'),
    ],
    'admin' => [
        // Cuando está activo, cambios estructurales (productos, categorías, reglas globales) exigen VPN.
        'require_vpn' => env('ADMIN_REQUIRE_VPN', true),
        'wireguard_cidr' => env('ADMIN_WIREGUARD_CIDR', '10.8.0.0/32'),
    ],
];
