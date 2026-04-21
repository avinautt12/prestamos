<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $titulo }}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
                    <!-- Header -->
                    <tr>
                        <td style="background:#16803C;padding:28px 32px;">
                            <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:600;letter-spacing:0.2px;">PrestamoFácil — Reporte ejecutivo</h1>
                            <p style="margin:6px 0 0;color:#D1FAE5;font-size:13px;">{{ $periodoEtiqueta }}</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:28px 32px;">
                            <p style="margin:0 0 12px;color:#111827;font-size:15px;line-height:1.55;">
                                Hola,
                            </p>
                            <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.7;">
                                Adjunto encontrarás el <strong>{{ $titulo }}</strong> correspondiente al alcance <strong>{{ $alcance }}</strong>.
                                El archivo contiene los 4 reportes ejecutivos en un solo Excel:
                            </p>
                            <ul style="margin:0 0 16px 18px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                                <li>Distribuidoras morosas y saldos</li>
                                <li>Saldo de cortes</li>
                                <li>Saldo de puntos por distribuidora al corte</li>
                                <li>Presolicitudes pendientes y validadas</li>
                            </ul>
                            <p style="margin:16px 0 0;color:#374151;font-size:14px;line-height:1.7;">
                                Este reporte se generó de forma automática. Si necesitas rangos personalizados, puedes descargar
                                una versión manual desde la pantalla <em>Reportes</em> del sistema.
                            </p>
                        </td>
                    </tr>

                    <!-- Meta -->
                    <tr>
                        <td style="padding:0 32px 28px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;">
                                <tr>
                                    <td style="padding:14px 18px;color:#6B7280;font-size:12px;line-height:1.6;">
                                        <strong style="color:#111827;">Alcance:</strong> {{ $alcance }}<br>
                                        <strong style="color:#111827;">Periodo:</strong> {{ $periodoEtiqueta }}<br>
                                        <strong style="color:#111827;">Archivo adjunto:</strong> {{ $nombreArchivo }}<br>
                                        <strong style="color:#111827;">Generado:</strong> {{ now()->toDateTimeString() }}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB;">
                            <p style="margin:0;color:#9CA3AF;font-size:11px;text-align:center;">
                                Sistema PrestamoFácil · Mensaje automático, no responder.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
