<?php

namespace Database\Seeders;

use App\Models\CuentaBancaria;
use Illuminate\Database\Seeder;

class CuentasBancariasEmpresaSeeder extends Seeder
{
    public function run(): void
    {
        $cuentas = [
            ['clabe' => '002115016003241108', 'banco' => 'BBVA', 'nombre_titular' => 'Prestamos del Norte SA de CV', 'numero_cuenta_mascarado' => '****2411', 'convenio' => '1628789', 'referencia_base' => 'PNBBVA', 'es_principal' => true],
            ['clabe' => '072180012345678901', 'banco' => 'Banorte', 'nombre_titular' => 'Prestamos del Norte SA de CV', 'numero_cuenta_mascarado' => '****8901', 'convenio' => '57148', 'referencia_base' => 'PNBNRT', 'es_principal' => false],
            ['clabe' => '014180056007891234', 'banco' => 'Santander', 'nombre_titular' => 'Prestamos del Norte SA de CV', 'numero_cuenta_mascarado' => '****1234', 'convenio' => 'SDR993', 'referencia_base' => 'PNSAN', 'es_principal' => false],
        ];

        foreach ($cuentas as $cuenta) {
            CuentaBancaria::updateOrCreate(
                ['tipo_propietario' => 'EMPRESA', 'clabe' => $cuenta['clabe']],
                $cuenta + [
                    'propietario_id' => 1,
                    'creado_en' => now(),
                    'actualizado_en' => now(),
                ]
            );
        }

        $this->command?->info('Cuentas bancarias de empresa creadas/actualizadas.');
    }
}
