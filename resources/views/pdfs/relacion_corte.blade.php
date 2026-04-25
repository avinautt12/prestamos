<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Estado de Cuenta - Corte #{{ $relacion->numero_relacion }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #059669; padding-bottom: 10px; }
        .logo { font-size: 24px; font-weight: bold; color: #059669; }
        .info-box { width: 48%; display: inline-block; vertical-align: top; margin-bottom: 20px; }
        .info-box h3 { margin-top: 0; color: #059669; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .info-box p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; color: #374151; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-green { color: #059669; }
        .text-red { color: #dc2626; }
        .footer { position: fixed; bottom: -20px; left: 0px; right: 0px; height: 50px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #eee; padding-top: 10px;}
        .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">FINANCIERA</div>
        <h2>Estado de Cuenta</h2>
        <p>Documento generado el: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <div>
        <div class="info-box">
            <h3>Datos de la Distribuidora</h3>
            <p><span class="font-bold">Nombre:</span> {{ $distribuidora->persona->primer_nombre ?? 'N/A' }} {{ $distribuidora->persona->apellido_paterno ?? '' }}</p>
            <p><span class="font-bold">Número:</span> {{ $distribuidora->numero_distribuidora ?? 'N/A' }}</p>
            <p><span class="font-bold">Categoría:</span> {{ $distribuidora->categoria->nombre ?? 'N/A' }}</p>
            <p><span class="font-bold">Crédito Disponible:</span> ${{ number_format($distribuidora->credito_disponible ?? 0, 2) }}</p>
        </div>
        <div class="info-box" style="margin-left: 3%;">
            <h3>Detalles del Corte</h3>
            <p><span class="font-bold">Relación #:</span> {{ $relacion->numero_relacion }}</p>
            <p><span class="font-bold">Fecha de Generación:</span> {{ \Carbon\Carbon::parse($relacion->generada_en)->format('d/m/Y') }}</p>
            <p><span class="font-bold">Fecha Límite de Pago:</span> {{ \Carbon\Carbon::parse($relacion->fecha_limite_pago)->format('d/m/Y') }}</p>
            <p><span class="font-bold">Estado:</span> {{ $relacion->estado }}</p>
            <p><span class="font-bold">Referencia de Pago:</span> {{ $relacion->referencia_pago }}</p>
        </div>
    </div>

    <div class="summary-box">
        <h3 style="margin-top: 0; color: #059669;">Resumen de Totales</h3>
        <table style="border: none; margin-top: 0;">
            <tr>
                <td style="border: none; width: 33%;"><strong>Total a Pagar:</strong><br>${{ number_format($relacion->total_a_pagar, 2) }}</td>
                <td style="border: none; width: 33%;"><strong>Monto Pagado/Reportado:</strong><br>${{ number_format($montoReportadoAcumulado, 2) }}</td>
                <td style="border: none; width: 33%;"><strong>Saldo Pendiente:</strong><br><span class="{{ $saldoPendiente > 0 ? 'text-red' : 'text-green' }}">${{ number_format($saldoPendiente, 2) }}</span></td>
            </tr>
        </table>
    </div>

    <h3 style="margin-top: 30px; color: #374151;">Desglose de Vales (Partidas)</h3>
    <table>
        <thead>
            <tr>
                <th>Vale #</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th class="text-right">Monto a Cobrar</th>
            </tr>
        </thead>
        <tbody>
            @forelse($relacion->partidas as $partida)
            <tr>
                <td>{{ $partida->vale->numero_vale ?? 'N/A' }}</td>
                <td>
                    {{ $partida->vale->cliente->persona->primer_nombre ?? '' }} 
                    {{ $partida->vale->cliente->persona->apellido_paterno ?? '' }}
                </td>
                <td>{{ $partida->vale->productoFinanciero->nombre ?? 'N/A' }}</td>
                <td class="text-right">${{ number_format($partida->monto_total_linea, 2) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align: center;">No hay partidas registradas en este corte.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div style="margin-top: 40px; padding-top: 10px; border-top: 1px solid #ddd;">
        <h3 style="color: #059669; margin-top: 0;">Información para pago:</h3>
        <p style="font-size: 13px;">Puedes realizar tu pago en los banco(s) que se muestran a continuación usando la <strong>Referencia de Pago: {{ $relacion->referencia_pago }}</strong>.</p>
        
        <table style="margin-top: 15px;">
            <thead style="background-color: #f8fafc;">
                <tr>
                    <th>Banco</th>
                    <th>Titular de la cuenta</th>
                    <th>CLABE</th>
                    <th>Convenio</th>
                </tr>
            </thead>
            <tbody>
                @forelse($cuentasEmpresa as $cuenta)
                <tr>
                    <td class="font-bold">{{ $cuenta->banco }}</td>
                    <td>{{ $cuenta->nombre_titular }}</td>
                    <td>{{ $cuenta->clabe }}</td>
                    <td>{{ $cuenta->convenio ?: 'N/A' }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="4" style="text-align: center;">Consulta con la sucursal las cuentas bancarias para depositar.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Este documento es una referencia de pago oficial. Si tiene alguna duda o aclaración, contacte a su sucursal.</p>
        <p>Página 1 de 1</p>
    </div>
</body>
</html>
