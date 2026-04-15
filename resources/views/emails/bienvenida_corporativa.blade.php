<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenida al equipo | Préstamo Fácil</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    </style>
</head>
<body style="font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; color: #1e293b;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
        <!-- Header -->
        <tr>
            <td style="background-color: #0f172a; padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Préstamo Fácil</h1>
                <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 15px;">Portal Corporativo</p>
            </td>
        </tr>
        
        <!-- Body -->
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 24px 0; font-size: 20px; color: #0f172a;">¡Bienvenido al equipo, {{ $nombre }}! 👋</h2>
                
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #475569;">
                    El administrador del sistema ha creado tu perfil oficial como <strong>{{ $rolNombre }}</strong>. Te compartimos a continuación tus credenciales de acceso para que puedas iniciar sesión.
                </p>

                <!-- Tarjeta de Credenciales -->
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
                    
                    <div style="margin-bottom: 16px;">
                        <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Usuario</p>
                        <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #0f172a;">{{ $nombreUsuario }}</p>
                    </div>

                    <div>
                        <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Contraseña Asignada</p>
                        <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #0f172a; font-family: monospace; background-color: #ffffff; display: inline-block; padding: 4px 8px; border-radius: 4px; border: 1px dashed #cbd5e1;">{{ $passwordPlano }}</p>
                    </div>

                </div>

                <div style="text-align: center; margin-bottom: 32px; margin-top: 32px;">
                    <a href="{{ $loginUrl }}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.4);">
                        Acceder al Portal
                    </a>
                </div>

                <p style="margin: 0; font-size: 14px; text-align: center; color: #64748b; font-style: italic;">
                    Nota: Por seguridad, no compartas estas credenciales con nadie.
                </p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #94a3b8;">
                    &copy; {{ date('Y') }} Préstamo Fácil Corporativo. Uso interno restringido.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
