<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $rules = [
            'nombre_usuario' => ['nullable', 'string', 'required_without:email'],
            'email' => ['nullable', 'email', 'required_without:nombre_usuario'],
            'password' => ['required', 'string'],
        ];

        if (config('recaptcha.enabled')) {
            $rules['recaptcha_token'] = ['required', 'string'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nombre_usuario.required_without' => 'El correo electrónico o el nombre de usuario son obligatorios.',
            'email.required_without' => 'El correo electrónico o el nombre de usuario son obligatorios.',
            'password.required' => 'La contraseña es obligatoria.',
            'recaptcha_token.required' => 'Validación de seguridad requerida. Recarga la página e intenta de nuevo.',
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();
        $this->ensureRecaptchaIsValid();

        $identifier = trim((string) ($this->input('nombre_usuario') ?: $this->input('email') ?: ''));

        $nombreUsuario = Usuario::query()
            ->whereRaw('LOWER(nombre_usuario) = ?', [Str::lower($identifier)])
            ->value('nombre_usuario') ?? $identifier;

        if (! Auth::attempt(['nombre_usuario' => $nombreUsuario, 'password' => $this->input('password')], $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'nombre_usuario' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'nombre_usuario' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Verifica el token de reCAPTCHA v3 contra la API de Google.
     * Rechaza el login si el score esta por debajo del umbral o el action no coincide.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    protected function ensureRecaptchaIsValid(): void
    {
        if (! config('recaptcha.enabled')) {
            return;
        }

        try {
            $response = Http::asForm()
                ->timeout(5)
                ->post(config('recaptcha.verify_url'), [
                    'secret'   => config('recaptcha.secret_key'),
                    'response' => $this->input('recaptcha_token'),
                    'remoteip' => $this->ip(),
                ]);

            $data = $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::warning('reCAPTCHA verify request failed', [
                'ip' => $this->ip(),
                'exception' => $e->getMessage(),
            ]);
            $data = [];
        }

        $success = (bool) ($data['success'] ?? false);
        $score   = (float) ($data['score'] ?? 0);
        $action  = (string) ($data['action'] ?? '');

        Log::info('reCAPTCHA verify', [
            'ip'      => $this->ip(),
            'success' => $success,
            'score'   => $score,
            'action'  => $action,
            'errors'  => $data['error-codes'] ?? [],
        ]);

        $valid = $success
            && $action === config('recaptcha.expected_action')
            && $score >= config('recaptcha.min_score');

        if (! $valid) {
            throw ValidationException::withMessages([
                'nombre_usuario' => 'No pudimos validar que seas un humano. Recarga la página e intenta de nuevo.',
            ]);
        }
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        $identifier = trim((string) ($this->input('nombre_usuario') ?: $this->input('email') ?: ''));

        return Str::transliterate(Str::lower($identifier) . '|' . $this->ip());
    }
}
