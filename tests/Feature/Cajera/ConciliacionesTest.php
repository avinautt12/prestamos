<?php

namespace Tests\Feature\Cajera;

use App\Models\Persona;
use App\Models\Rol;
use App\Models\Corte;
use App\Models\RelacionCorte;
use App\Models\Distribuidora;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class ConciliacionesTest extends TestCase
{
    use RefreshDatabase;

    public function test_importacion_csv_concilia_en_nivel_1_por_referencia_y_monto(): void
    {
        $fixture = $this->crearFixtureConciliacion();

        $csv = <<<CSV
item,Concepto,Referencia,Pago,Folio de pago,Fecha de pago,Hora,tipo de pago
    1,Abono a referencia 16A67819042,16A67819042,2100,A178934,08/04/2026,13:25,Transferencia
CSV;

        $archivo = UploadedFile::fake()->createWithContent('movimientos.csv', $csv);

        $response = $this->actingAs($fixture['cajera'])
            ->post(route('cajera.conciliaciones.importar'), [
                'archivo' => $archivo,
            ]);

        $response->assertRedirect(route('cajera.conciliaciones'));

        $this->assertDatabaseHas('movimientos_bancarios', [
            'referencia' => '16A67819042',
            'folio' => 'A178934',
            'monto' => 2100.00,
        ]);

        $this->assertDatabaseHas('pagos_distribuidora', [
            'relacion_corte_id' => $fixture['relacion']->id,
            'monto' => 2100.00,
            'estado' => 'CONCILIADO',
        ]);

        $this->assertDatabaseHas('conciliaciones', [
            'estado' => 'CONCILIADA',
            'monto_conciliado' => 2100.00,
        ]);

        $this->assertDatabaseHas('relaciones_corte', [
            'id' => $fixture['relacion']->id,
            'estado' => RelacionCorte::ESTADO_PAGADA,
        ]);
    }

    public function test_conciliacion_manual_con_diferencia_marca_relacion_parcial(): void
    {
        $fixture = $this->crearFixtureConciliacion();

        $movimientoId = DB::table('movimientos_bancarios')->insertGetId([
            'cuenta_banco_empresa_id' => null,
            'referencia' => 'REF-MAN-001',
            'fecha_movimiento' => '2026-04-08',
            'hora_movimiento' => '11:00:00',
            'monto' => 1800.00,
            'tipo_movimiento' => 'Transferencia',
            'folio' => 'MAN0001',
            'nombre_pagador' => 'Pago Manual',
            'concepto_raw' => 'Aplicacion manual para relacion',
            'creado_en' => now(),
        ]);

        $response = $this->actingAs($fixture['cajera'])
            ->post(route('cajera.conciliaciones.manual'), [
                'movimiento_bancario_id' => $movimientoId,
                'relacion_corte_id' => $fixture['relacion']->id,
                'estado' => 'CON_DIFERENCIA',
                'observaciones' => 'Aplicado manual por diferencia de monto.',
            ]);

        $response->assertRedirect(route('cajera.conciliaciones'));

        $this->assertDatabaseHas('conciliaciones', [
            'movimiento_bancario_id' => $movimientoId,
            'estado' => 'CON_DIFERENCIA',
            'diferencia_monto' => -300.00,
        ]);

        $this->assertDatabaseHas('pagos_distribuidora', [
            'relacion_corte_id' => $fixture['relacion']->id,
            'monto' => 1800.00,
            'estado' => 'CONCILIADO',
        ]);

        $this->assertDatabaseHas('relaciones_corte', [
            'id' => $fixture['relacion']->id,
            'estado' => RelacionCorte::ESTADO_PARCIAL,
        ]);
    }

    public function test_importacion_xlsx_concilia_automaticamente(): void
    {
        $fixture = $this->crearFixtureConciliacion();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['item', 'Concepto', 'Referencia', 'Pago', 'Folio de pago', 'Fecha de pago', 'Hora', 'tipo de pago'],
            [1, 'Abono a referencia 16A67819042', '16A67819042', 2100, 'A178934', '08/04/2026', '13:25', 'Transferencia'],
        ]);

        $tmp = tempnam(sys_get_temp_dir(), 'xlsx');
        $writer = new Xlsx($spreadsheet);
        $writer->save($tmp);

        $archivo = UploadedFile::fake()->createWithContent('movimientos.xlsx', (string) file_get_contents($tmp));
        @unlink($tmp);

        $response = $this->actingAs($fixture['cajera'])
            ->post(route('cajera.conciliaciones.importar'), [
                'archivo' => $archivo,
            ]);

        $response->assertRedirect(route('cajera.conciliaciones'));

        $this->assertDatabaseHas('movimientos_bancarios', [
            'referencia' => '16A67819042',
            'folio' => 'A178934',
            'monto' => 2100.00,
        ]);

        $this->assertDatabaseHas('conciliaciones', [
            'estado' => 'CONCILIADA',
            'monto_conciliado' => 2100.00,
        ]);
    }

    public function test_importacion_reporta_fila_duplicada_en_resumen(): void
    {
        $fixture = $this->crearFixtureConciliacion();

        DB::table('movimientos_bancarios')->insert([
            'cuenta_banco_empresa_id' => null,
            'referencia' => '16A67819042',
            'fecha_movimiento' => '2026-04-08',
            'hora_movimiento' => '13:25:00',
            'monto' => 2100.00,
            'tipo_movimiento' => 'Transferencia',
            'folio' => 'A178934',
            'nombre_pagador' => 'Duplicado',
            'concepto_raw' => 'Movimiento preexistente',
            'creado_en' => now(),
        ]);

        $csv = <<<CSV
item,Concepto,Referencia,Pago,Folio de pago,Fecha de pago,Hora,tipo de pago
1,Abono duplicado,16A67819042,2100,A178934,08/04/2026,13:25,Transferencia
CSV;

        $archivo = UploadedFile::fake()->createWithContent('duplicado.csv', $csv);

        $response = $this->actingAs($fixture['cajera'])
            ->post(route('cajera.conciliaciones.importar'), [
                'archivo' => $archivo,
            ]);

        $response->assertRedirect(route('cajera.conciliaciones'));
        $response->assertSessionHas('import_result', function (array $result): bool {
            return (int) ($result['stats']['duplicadas'] ?? 0) === 1
                && (int) ($result['stats']['procesadas'] ?? 0) === 1;
        });
    }

    public function test_importacion_reporta_fila_invalida_en_resumen(): void
    {
        $fixture = $this->crearFixtureConciliacion();

        $csv = <<<CSV
item,Concepto,Referencia,Pago,Folio de pago,Fecha de pago,Hora,tipo de pago
1,Abono invalido,16A67819042,NO_MONTO,A178934,fecha_mal,13:25,Transferencia
CSV;

        $archivo = UploadedFile::fake()->createWithContent('invalido.csv', $csv);

        $response = $this->actingAs($fixture['cajera'])
            ->post(route('cajera.conciliaciones.importar'), [
                'archivo' => $archivo,
            ]);

        $response->assertRedirect(route('cajera.conciliaciones'));
        $response->assertSessionHas('import_result', function (array $result): bool {
            return (int) ($result['stats']['invalidas'] ?? 0) === 1
                && (int) ($result['stats']['procesadas'] ?? 0) === 1;
        });
    }

    public function test_exportar_historial_descarga_csv(): void
    {
        $fixture = $this->crearFixtureConciliacion();

        $movimientoId = DB::table('movimientos_bancarios')->insertGetId([
            'cuenta_banco_empresa_id' => null,
            'referencia' => 'REF-EXPORT-001',
            'fecha_movimiento' => '2026-04-08',
            'hora_movimiento' => '12:30:00',
            'monto' => 2100.00,
            'tipo_movimiento' => 'Transferencia',
            'folio' => 'EXP0001',
            'nombre_pagador' => 'Export Test',
            'concepto_raw' => 'Movimiento para exportar historial',
            'creado_en' => now(),
        ]);

        $this->actingAs($fixture['cajera'])
            ->post(route('cajera.conciliaciones.manual'), [
                'movimiento_bancario_id' => $movimientoId,
                'relacion_corte_id' => $fixture['relacion']->id,
                'estado' => 'CONCILIADA',
                'observaciones' => 'Generar registro para exportacion',
            ])
            ->assertRedirect(route('cajera.conciliaciones'));

        $response = $this->actingAs($fixture['cajera'])
            ->get(route('cajera.conciliaciones.exportar', ['format' => 'csv']));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('attachment; filename=', (string) $response->headers->get('content-disposition'));
    }

    public function test_exportar_historial_descarga_excel(): void
    {
        $fixture = $this->crearFixtureConciliacion();

        $movimientoId = DB::table('movimientos_bancarios')->insertGetId([
            'cuenta_banco_empresa_id' => null,
            'referencia' => 'REF-EXPORT-XLSX-001',
            'fecha_movimiento' => '2026-04-08',
            'hora_movimiento' => '12:31:00',
            'monto' => 2100.00,
            'tipo_movimiento' => 'Transferencia',
            'folio' => 'EXPXLSX1',
            'nombre_pagador' => 'Export Xlsx Test',
            'concepto_raw' => 'Movimiento para exportar historial excel',
            'creado_en' => now(),
        ]);

        $this->actingAs($fixture['cajera'])
            ->post(route('cajera.conciliaciones.manual'), [
                'movimiento_bancario_id' => $movimientoId,
                'relacion_corte_id' => $fixture['relacion']->id,
                'estado' => 'CONCILIADA',
                'observaciones' => 'Generar registro para exportacion xlsx',
            ])
            ->assertRedirect(route('cajera.conciliaciones'));

        $response = $this->actingAs($fixture['cajera'])
            ->get(route('cajera.conciliaciones.exportar', ['format' => 'xlsx']));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsString('.xlsx', (string) $response->headers->get('content-disposition'));
    }

    public function test_blindaje_bd_impide_segunda_conciliacion_para_mismo_movimiento(): void
    {
        $fixture = $this->crearFixtureConciliacion();

        $movimientoId = DB::table('movimientos_bancarios')->insertGetId([
            'cuenta_banco_empresa_id' => null,
            'referencia' => 'REF-UNIQUE-001',
            'fecha_movimiento' => '2026-04-08',
            'hora_movimiento' => '12:45:00',
            'monto' => 2100.00,
            'tipo_movimiento' => 'Transferencia',
            'folio' => 'UNQ0001',
            'nombre_pagador' => 'Unique Test',
            'concepto_raw' => 'Movimiento para validar unique',
            'creado_en' => now(),
        ]);

        $this->actingAs($fixture['cajera'])
            ->post(route('cajera.conciliaciones.manual'), [
                'movimiento_bancario_id' => $movimientoId,
                'relacion_corte_id' => $fixture['relacion']->id,
                'estado' => 'CONCILIADA',
                'observaciones' => 'Primera conciliacion',
            ])
            ->assertRedirect(route('cajera.conciliaciones'));

        $pagoExtraId = DB::table('pagos_distribuidora')->insertGetId([
            'relacion_corte_id' => $fixture['relacion']->id,
            'distribuidora_id' => $fixture['distribuidora']->id,
            'cuenta_banco_empresa_id' => null,
            'monto' => 100.00,
            'metodo_pago' => 'OTRO',
            'referencia_reportada' => 'REF-EXTRA-001',
            'fecha_pago' => now(),
            'estado' => 'REPORTADO',
            'observaciones' => 'Pago extra para probar unique',
            'creado_en' => now(),
        ]);

        $this->expectException(QueryException::class);

        DB::table('conciliaciones')->insert([
            'pago_distribuidora_id' => $pagoExtraId,
            'movimiento_bancario_id' => $movimientoId,
            'conciliado_por_usuario_id' => $fixture['cajera']->id,
            'conciliado_en' => now(),
            'monto_conciliado' => 100.00,
            'diferencia_monto' => 0.00,
            'estado' => 'CONCILIADA',
            'observaciones' => 'Intento duplicado forzado',
        ]);
    }

    private function crearFixtureConciliacion(): array
    {
        $sucursal = Sucursal::query()->create([
            'codigo' => 'SUC-CNC',
            'nombre' => 'Sucursal Conciliacion',
            'activo' => true,
        ]);

        $rolCajera = Rol::query()->firstOrCreate(
            ['codigo' => 'CAJERA'],
            ['nombre' => 'Cajera', 'activo' => true]
        );

        $personaCajera = Persona::query()->create([
            'primer_nombre' => 'Ana',
            'apellido_paterno' => 'Caja',
        ]);

        $cajera = Usuario::query()->create([
            'persona_id' => $personaCajera->id,
            'nombre_usuario' => 'cajera_test',
            'clave_hash' => Hash::make('secreto123'),
            'activo' => true,
            'requiere_vpn' => false,
            'canal_login' => Usuario::CANAL_WEB,
        ]);

        DB::table('usuario_rol')->insert([
            'usuario_id' => $cajera->id,
            'rol_id' => $rolCajera->id,
            'sucursal_id' => $sucursal->id,
            'asignado_en' => now(),
            'revocado_en' => null,
            'es_principal' => true,
        ]);

        $personaDistribuidora = Persona::query()->create([
            'primer_nombre' => 'Diana',
            'apellido_paterno' => 'Distribuidora',
        ]);

        $distribuidora = Distribuidora::query()->create([
            'persona_id' => $personaDistribuidora->id,
            'sucursal_id' => $sucursal->id,
            'numero_distribuidora' => 'DIST-TEST-001',
            'estado' => Distribuidora::ESTADO_ACTIVA,
            'limite_credito' => 10000,
            'credito_disponible' => 6000,
            'puede_emitir_vales' => true,
        ]);

        $corte = Corte::query()->create([
            'sucursal_id' => $sucursal->id,
            'tipo_corte' => Corte::TIPO_PAGOS,
            'fecha_programada' => now(),
            'estado' => Corte::ESTADO_EJECUTADO,
        ]);

        $relacion = RelacionCorte::query()->create([
            'corte_id' => $corte->id,
            'distribuidora_id' => $distribuidora->id,
            'numero_relacion' => 'REL-TEST-001',
            'referencia_pago' => '16A67819042',
            'fecha_limite_pago' => now()->addDays(3)->toDateString(),
            'total_a_pagar' => 2100.00,
            'estado' => RelacionCorte::ESTADO_GENERADA,
        ]);

        return [
            'cajera' => $cajera,
            'sucursal' => $sucursal,
            'distribuidora' => $distribuidora,
            'relacion' => $relacion,
        ];
    }
}
