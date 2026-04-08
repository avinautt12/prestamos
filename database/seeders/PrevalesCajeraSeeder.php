<?php

namespace Database\Seeders;

use App\Models\CuentaBancaria;
use App\Models\Persona;
use App\Models\Solicitud;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class PrevalesCajeraSeeder extends Seeder
{
    public function run(): void
    {
        $sucursal = Sucursal::where('codigo', 'SUC-MATRIZ')->first();
        $coordinador = Usuario::where('nombre_usuario', 'coordinador')->first();

        if (!$sucursal || !$coordinador) {
            $this->command?->warn('Faltan datos base. Ejecuta primero UsuarioTestSeeder.');
            return;
        }

        // Caso 1: Solicitud Lista para Aprobar (Con Cuenta Bancaria)
        $persona1 = Persona::create([
            'correo_electronico' => 'candidata01@prestamofacil.com',
            'curp' => 'CAND010101HDFAAA01',
            'primer_nombre' => 'Rosa',
            'apellido_paterno' => 'Melendez',
            'apellido_materno' => 'Ruiz',
            'sexo' => 'F',
            'telefono_celular' => '8715550001',
            'calle' => 'Calle Falsa',
            'numero_exterior' => '123',
            'colonia' => 'Centro',
            'ciudad' => 'Gomez Palacio',
            'estado' => 'DGO',
            'codigo_postal' => '35000',
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $cuenta1 = CuentaBancaria::create([
            'tipo_propietario' => 'PERSONA',
            'propietario_id' => $persona1->id,
            'banco' => 'Banorte',
            'nombre_titular' => 'Rosa Melendez Ruiz',
            'clabe' => '072123001234567890',
            'es_principal' => true,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        Solicitud::create([
            'persona_solicitante_id' => $persona1->id,
            'sucursal_id' => $sucursal->id,
            'capturada_por_usuario_id' => $coordinador->id,
            'coordinador_usuario_id' => $coordinador->id,
            'cuenta_bancaria_id' => $cuenta1->id,
            'estado' => Solicitud::ESTADO_VERIFICADA, // <--- CLAVE
            'limite_credito_solicitado' => 6000.00,
            'prevale_aprobado' => false,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        // Caso 2: Solicitud Sin Cuenta Bancaria (Para probar que el botón se bloquee)
        $persona2 = Persona::create([
            'correo_electronico' => 'candidata02@prestamofacil.com',
            'curp' => 'CAND020202MDFAAA02',
            'primer_nombre' => 'Mario',
            'apellido_paterno' => 'Castañeda',
            'apellido_materno' => 'Perez',
            'sexo' => 'M',
            'telefono_celular' => '8715550002',
            'calle' => 'Av. Universidad',
            'numero_exterior' => '456',
            'colonia' => 'Las Rosas',
            'ciudad' => 'Gomez Palacio',
            'estado' => 'DGO',
            'codigo_postal' => '35050',
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        Solicitud::create([
            'persona_solicitante_id' => $persona2->id,
            'sucursal_id' => $sucursal->id,
            'capturada_por_usuario_id' => $coordinador->id,
            'coordinador_usuario_id' => $coordinador->id,
            'cuenta_bancaria_id' => null, // <--- SIN CUENTA
            'estado' => Solicitud::ESTADO_POSIBLE_DISTRIBUIDORA, // <--- CLAVE
            'limite_credito_solicitado' => 10000.00,
            'prevale_aprobado' => false,
            'creado_en' => now(),
            'actualizado_en' => now(),
        ]);

        $this->command?->info('2 solicitudes listas para el módulo de Prevale (Cajera) creadas.');
    }
}