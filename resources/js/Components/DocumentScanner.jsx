import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTimes, faCheck, faSync, faExclamationTriangle, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

export default function DocumentScanner({ onCapture, onCancel, title = "Escanea la INE" }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [error, setError] = useState(null);

    const startCamera = async () => {
        setError(null);
        setIsCameraReady(false);

        if (!window.isSecureContext && window.location.protocol !== 'http:' && window.location.hostname !== 'localhost') {
            setError("CONEXIÓN NO SEGURA: El acceso a la cámara requiere HTTPS en móviles por seguridad del navegador.");
            return;
        }

        try {
            const constraints = {
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Forzamos el play después de asignar el stream
                try {
                    await videoRef.current.play();
                    setIsCameraReady(true);
                } catch (playErr) {
                    console.error("Error al reproducir video:", playErr);
                }
            }
        } catch (err) {
            console.error("Error al acceder a la cámara: ", err);
            if (err.name === 'NotAllowedError') {
                setError("PERMISO DENEGADO: Por favor, permite el acceso a la cámara en los ajustes de tu navegador o celular.");
            } else if (err.name === 'NotFoundError') {
                setError("CÁMARA NO ENCONTRADA: No se detectó una cámara trasera disponible.");
            } else {
                setError("ERROR DE CÁMARA: No se pudo iniciar el video. Revisa los permisos de tu dispositivo.");
            }
        }
    };

    useEffect(() => {
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const takePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Dimensiones reales del video recibido por la cámara
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // Configuramos el canvas con la resolución original
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        // Dibujamos todo el fotograma en el canvas temporal
        context.drawImage(video, 0, 0, videoWidth, videoHeight);

        // --- MATEMÁTICAS DE RECORTE (El secreto para quitar el fondo) ---
        // Asumimos que la guía visual (el hueco) ocupa el 80% del ancho de la pantalla
        // y tiene una proporción de tarjeta de crédito (aprox 1.58:1)
        const guideWidthRatio = 0.85;

        const cropWidth = videoWidth * guideWidthRatio;
        const cropHeight = cropWidth / 1.58;

        // Calculamos las coordenadas X e Y para centrar el recorte
        const startX = (videoWidth - cropWidth) / 2;
        const startY = (videoHeight - cropHeight) / 2;

        // Obtenemos los píxeles exactos del área recortada
        const imageData = context.getImageData(startX, startY, cropWidth, cropHeight);

        // Ajustamos el canvas al tamaño del recorte final y pegamos los píxeles
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        context.putImageData(imageData, 0, 0);

        // Convertimos el canvas a una imagen en Base64 (JPG)
        const base64Image = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(base64Image);

        // Apagamos la cámara temporalmente
        if (stream) stream.getTracks().forEach(track => track.stop());

    }, [stream]);

    const handleConfirm = () => {
        // Convierte el base64 a un objeto File para enviarlo a Laravel
        fetch(capturedImage)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "ine_escaneada.jpg", { type: "image/jpeg" });
                onCapture(file, capturedImage); // Enviamos el archivo real y la vista previa
            });
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/80 text-white z-10">
                <button onClick={onCancel} className="text-white p-2">
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
                <h3 className="font-bold text-sm tracking-widest uppercase">{title}</h3>
                <div className="w-8"></div> {/* Espaciador */}
            </div>

            {/* Área de Cámara */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-gray-900">

                {capturedImage ? (
                    <img src={capturedImage} alt="Captura" className="w-[85%] rounded-xl shadow-2xl object-contain" />
                ) : error ? (
                    <div className="flex flex-col items-center p-8 text-center bg-gray-900">
                        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-500/20 text-red-500">
                            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                        </div>
                        <p className="text-white font-bold mb-2">{error}</p>
                        <p className="text-gray-400 text-sm mb-6">Asegúrate de estar usando HTTPS y de haber aceptado la solicitud de permisos del navegador.</p>
                        <button 
                            onClick={startCamera}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-transform"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Video en vivo */}
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        
                        {/* La Máscara (La guía visual para el usuario) */}
                        <div className="absolute inset-0 z-10 pointer-events-none"
                             style={{
                                 // Usamos box-shadow para oscurecer todo excepto el centro
                                 boxShadow: 'inset 0 0 0 2000px rgba(0,0,0,0.6)'
                             }}>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] aspect-[1.58/1] border-2 border-white rounded-xl shadow-[0_0_0_4000px_rgba(0,0,0,0.7)] flex items-center justify-center">
                                {/* Guías en las esquinas para dar aspecto tecnológico */}
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                                
                                {!isCameraReady && <p className="text-white/50 text-sm">Iniciando cámara...</p>}
                            </div>
                        </div>
                    </>
                )}

                {/* Canvas oculto usado solo para el procesamiento matemático */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controles de abajo */}
            <div className="bg-black p-6 pb-10 flex items-center justify-center gap-8">
                {capturedImage ? (
                    <>
                        <button onClick={handleRetake} className="flex flex-col items-center text-white/70 hover:text-white">
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                                <FontAwesomeIcon icon={faSync} />
                            </div>
                            <span className="text-xs font-bold">Repetir</span>
                        </button>
                        <button onClick={handleConfirm} className="flex flex-col items-center text-blue-400 hover:text-blue-300">
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                                <FontAwesomeIcon icon={faCheck} className="text-white text-xl" />
                            </div>
                            <span className="text-xs font-bold text-white">Usar foto</span>
                        </button>
                    </>
                ) : (
                    <button
                        onClick={takePhoto}
                        disabled={!isCameraReady}
                        className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center focus:outline-none disabled:opacity-50"
                    >
                        <div className="w-16 h-16 bg-white rounded-full active:scale-95 transition-transform"></div>
                    </button>
                )}
            </div>
        </div>
    );
}