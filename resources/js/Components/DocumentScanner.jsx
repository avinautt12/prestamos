import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck, faSync, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export default function DocumentScanner({
    onCapture,
    onCancel,
    title = 'Escanea la INE',
    captureMode = 'environment',
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const streamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [error, setError] = useState(null);

    const stopCurrentStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        setError(null);
        setIsCameraReady(false);

        const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

        if (!window.isSecureContext && !isLocalHost) {
            setError('CONEXION NO SEGURA: El acceso a la camara requiere HTTPS en moviles por seguridad del navegador.');
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('CAMARA NO DISPONIBLE: Este navegador o modo PWA no permite abrir la camara integrada.');
            return;
        }

        stopCurrentStream();

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: captureMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });

            streamRef.current = mediaStream;

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }

            setIsCameraReady(true);
        } catch (err) {
            console.error('Error al acceder a la camara:', err);

            if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
                setError('PERMISO O BLOQUEO DEL NAVEGADOR: La camara fue bloqueada por permisos, configuracion del navegador o politica del sitio.');
            } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
                setError('CAMARA NO ENCONTRADA: No se detecto una camara compatible para este modo de captura.');
            } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
                setError('CAMARA EN USO: Otra aplicacion o pestana esta usando la camara en este momento.');
            } else {
                setError('ERROR DE CAMARA: No se pudo iniciar el video. Revisa los permisos y la configuracion del dispositivo.');
            }
        }
    }, [captureMode, stopCurrentStream]);

    useEffect(() => {
        startCamera();

        return () => {
            stopCurrentStream();
        };
    }, [startCamera, stopCurrentStream]);

    const takePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context || !video.videoWidth || !video.videoHeight) return;

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        canvas.width = videoWidth;
        canvas.height = videoHeight;
        context.drawImage(video, 0, 0, videoWidth, videoHeight);

        const guideWidthRatio = 0.85;
        const cropWidth = videoWidth * guideWidthRatio;
        const cropHeight = cropWidth / 1.58;
        const startX = (videoWidth - cropWidth) / 2;
        const startY = (videoHeight - cropHeight) / 2;
        const imageData = context.getImageData(startX, startY, cropWidth, cropHeight);

        canvas.width = cropWidth;
        canvas.height = cropHeight;
        context.putImageData(imageData, 0, 0);

        const base64Image = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(base64Image);
        stopCurrentStream();
    }, [stopCurrentStream]);

    const handleConfirm = () => {
        if (!capturedImage) return;

        fetch(capturedImage)
            .then((res) => res.blob())
            .then((blob) => {
                const file = new File([blob], 'ine_escaneada.jpg', { type: 'image/jpeg' });
                onCapture(file, capturedImage);
            })
            .catch(() => {
                setError('ERROR DE IMAGEN: No se pudo preparar la foto para enviarla.');
            });
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleNativeCapture = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        onCapture(file, previewUrl);
        event.target.value = '';
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <div className="flex items-center justify-between p-4 bg-black/80 text-white z-10">
                <button onClick={onCancel} className="text-white p-2">
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
                <h3 className="font-bold text-sm tracking-widest uppercase">{title}</h3>
                <div className="w-8"></div>
            </div>

            <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-gray-900">
                {capturedImage ? (
                    <img src={capturedImage} alt="Captura" className="w-[85%] rounded-xl shadow-2xl object-contain" />
                ) : error ? (
                    <div className="flex flex-col items-center p-8 text-center bg-gray-900">
                        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-500/20 text-red-500">
                            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                        </div>
                        <p className="text-white font-bold mb-2">{error}</p>
                        <p className="text-gray-400 text-sm mb-6">
                            Asegurate de usar HTTPS. Si el modo PWA no responde bien, puedes abrir la camara nativa del telefono desde aqui.
                        </p>
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <button
                                onClick={startCamera}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-transform"
                            >
                                Intentar de nuevo
                            </button>
                            <button
                                onClick={handleNativeCapture}
                                className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold border border-white/20 active:scale-95 transition-transform"
                            >
                                Usar camara del dispositivo
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        <div
                            className="absolute inset-0 z-10 pointer-events-none"
                            style={{
                                boxShadow: 'inset 0 0 0 2000px rgba(0,0,0,0.6)',
                            }}
                        >
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] aspect-[1.58/1] border-2 border-white rounded-xl shadow-[0_0_0_4000px_rgba(0,0,0,0.7)] flex items-center justify-center">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

                                {!isCameraReady && <p className="text-white/50 text-sm">Iniciando camara...</p>}
                            </div>
                        </div>
                    </>
                )}

                <canvas ref={canvasRef} className="hidden" />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture={captureMode}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

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
