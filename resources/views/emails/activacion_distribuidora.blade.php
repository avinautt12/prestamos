<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activación de cuenta | Préstamo Fácil</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    </style>
</head>
<body style="font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; color: #1e293b;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
        <!-- Header -->
        <tr>
            <td style="background-color: #10b981; padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Préstamo Fácil</h1>
                <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 15px;">Tu plataforma financiera</p>
            </td>
        </tr>
        
        <!-- Body -->
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 24px 0; font-size: 20px; color: #0f172a;">¡Felicidades, {{ $nombre }}! 🎉</h2>
                
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #475569;">
                    Nos complace informarte que tu solicitud fue aprobada exitosamente y ya puedes activar tu acceso oficial a la aplicación de <strong>Préstamo Fácil</strong>.
                </p>

                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #10b981;">
                    <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Número de Distribuidora</p>
                    <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #0f172a; font-family: monospace;">{{ $numeroDistribuidora }}</p>
                </div>

                <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.5; color: #475569;">
                    Para completar tu registro empresarial y configurar tu contraseña de acceso, por favor haz clic en el siguiente botón:
                </p>

                <div style="text-align: center; margin-bottom: 32px;">
                    <a href="{{ $activationLink }}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">
                        Activar mi cuenta
                    </a>
                </div>

                <p style="margin: 0; font-size: 14px; text-align: center; color: #94a3b8;">
                    Este enlace de seguridad es único y expira automáticamente en 24 horas.
                </p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                    Si no solicitaste este acceso o crees que es un error, puedes ignorar este mensaje de forma segura.
                </p>
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #94a3b8;">
                    &copy; {{ date('Y') }} Préstamo Fácil corporativo. Todos los derechos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>