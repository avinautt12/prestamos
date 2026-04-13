<?php

return [
    'enabled'         => filter_var(env('RECAPTCHA_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
    'site_key'        => env('RECAPTCHA_SITE_KEY'),
    'secret_key'      => env('RECAPTCHA_SECRET_KEY'),
    'min_score'       => (float) env('RECAPTCHA_MIN_SCORE', 0.5),
    'verify_url'      => 'https://www.google.com/recaptcha/api/siteverify',
    'expected_action' => 'login',
];
