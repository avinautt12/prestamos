<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activacion de cuenta</title>
</head>

<body style="font-family: Arial, sans-serif; color:#0f172a; line-height:1.5;">
    <h2 style="margin-bottom: 12px;">Hola {{ $nombre }}</h2>

    <p>Tu solicitud fue aprobada y ya puedes activar tu acceso a la app.</p>

    <p><strong>Numero de distribuidora:</strong> {{ $numeroDistribuidora }}</p>

    <p>
        Para crear tu contrasena, abre este enlace:
        <br>
        <a href="{{ $activationLink }}">{{ $activationLink }}</a>
    </p>

    <p>Este enlace es temporal y expira en 24 horas.</p>

    <p>Si no solicitaste este acceso, ignora este mensaje.</p>

    <hr style="margin-top: 20px; border: none; border-top: 1px solid #e2e8f0;">
    <p style="font-size: 12px; color:#64748b;">Prestamo Facil - Mensaje automatico, por favor no responder.</p>
</body>

</html>