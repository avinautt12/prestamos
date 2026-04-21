<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecimiento de Contraseña</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
            color: #334155;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
            background-color: #10b981; /* Emerald 500 */
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #0f172a;
        }
        .message {
            margin-bottom: 30px;
            font-size: 16px;
        }
        .highlight {
            color: #10b981;
            font-weight: 600;
        }
        .warning {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px 20px;
            margin-bottom: 30px;
            border-radius: 0 6px 6px 0;
            font-size: 14px;
            color: #b91c1c;
        }
        .button-container {
            text-align: center;
            margin: 40px 0;
        }
        .button {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .button:hover {
            background-color: #059669; /* Emerald 600 */
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .fallback {
            word-break: break-all;
            color: #3b82f6;
            font-size: 13px;
            margin-top: 10px;
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Solicitud Aprobada!</h1>
        </div>
        <div class="content">
            <div class="greeting">
                Hola {{ $usuario->persona ? $usuario->persona->primer_nombre : $usuario->nombre_usuario }},
            </div>
            
            <div class="message">
                Tu solicitud para restablecer la contraseña ha sido <span class="highlight">Aprobada</span> por tu Gerente o Administrador. Ya puedes configurar una nueva contraseña para tu cuenta del sistema.
            </div>

            <div class="warning">
                <strong>Importante:</strong> El siguiente enlace de acceso tiene una vigencia estricta de <strong>10 minutos</strong>. Después de este tiempo se autodestruirá por razones de seguridad corporativa.
            </div>

            <div class="button-container">
                <a href="{{ $url_reset }}" class="button" style="color: white !important;">
                    Restablecer Mi Contraseña
                </a>
            </div>

        </div>
        <div class="footer">
            ¿El botón no funciona? Copia y pega esta dirección en tu navegador web:
            <a href="{{ $url_reset }}" class="fallback">{{ $url_reset }}</a>
            <br><br>
            Este es un correo automático, por favor no respondas a esta dirección.
        </div>
    </div>
</body>
</html>
