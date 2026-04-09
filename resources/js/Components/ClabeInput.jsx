import React, { useState, useEffect } from 'react';

const BANCOS_MEXICO = {
    '002': 'Banamex',
    '012': 'BBVA Bancomer',
    '014': 'Santander',
    '021': 'HSBC',
    '030': 'BanBajío',
    '032': 'IXE',
    '036': 'Inbursa',
    '044': 'Scotiabank',
    '058': 'Banregio',
    '042': 'Mifel',
    '072': 'Banorte',
    '127': 'Banco Azteca',
    '130': 'Compartamos',
    '137': 'BanCoppel',
    '141': 'Consubanco',
    '143': 'CIBanco',
    '148': 'Bankaool',
    '156': 'Sabadell',
    '638': 'Nu México',
    '644': 'Kueski',
    '654': 'Ualá',
    '722': 'Mercado Pago',
};

const procesarClabe = (clabe) => {
    if (!clabe || clabe.length !== 18) return { isValid: false, banco: '', mensaje: '' };

    const codigoBanco = clabe.substring(0, 3);
    const nombreBanco = BANCOS_MEXICO[codigoBanco] || `Banco Desconocido (${codigoBanco})`;

    const pesos = [3, 7, 1];
    let suma = 0;

    for (let i = 0; i < 17; i++) {
        suma += (parseInt(clabe[i], 10) * pesos[i % 3]) % 10;
    }

    const digitoCalculado = (10 - (suma % 10)) % 10;
    const digitoProporcionado = parseInt(clabe[17], 10);

    if (digitoCalculado === digitoProporcionado) {
        return { isValid: true, banco: nombreBanco, mensaje: 'CLABE Válida' };
    } else {
        return { isValid: false, banco: nombreBanco, mensaje: 'El dígito verificador no coincide.' };
    }
};

export default function ClabeInput({
    value,
    onChange,
    onBankDetected,
    className = '',
    error = null
}) {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (value && value.length === 18) {
            evaluarClabe(value);
        }
    }, [value]);

    const evaluarClabe = (clabeActual) => {
        const resultado = procesarClabe(clabeActual);
        setStatus(resultado);
        if (onBankDetected) {
            onBankDetected(resultado.banco, resultado.isValid);
        }
    };

    const handleChange = (e) => {
        const valorLimpio = e.target.value.replace(/\D/g, '').substring(0, 18);
        onChange(valorLimpio);

        if (valorLimpio.length === 18) {
            evaluarClabe(valorLimpio);
        } else {
            setStatus(null);
            if (onBankDetected) onBankDetected('', false);
        }
    };

    let borderColor = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    if (error || status?.isValid === false) borderColor = 'border-red-500 focus:border-red-500 focus:ring-red-500';
    if (status?.isValid === true) borderColor = 'border-green-500 focus:border-green-500 focus:ring-green-500';

    return (
        <div className="w-full">
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder="Ej. 012345678901234567"
                    className={`block w-full rounded-lg shadow-sm sm:text-sm transition-colors ${borderColor} ${className}`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className={`text-xs ${value?.length === 18 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                        {value?.length || 0}/18
                    </span>
                </div>
            </div>

            {status && (
                <p className={`mt-1 text-xs font-semibold ${status.isValid ? 'text-green-600' : 'text-red-500'}`}>
                    {status.isValid ? `Banco detectado: ${status.banco}` : status.mensaje}
                </p>
            )}

            {error && !status && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
