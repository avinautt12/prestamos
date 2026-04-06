import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function isValidLatLng(pos) {
    return (
        Array.isArray(pos) &&
        pos.length === 2 &&
        Number.isFinite(pos[0]) &&
        Number.isFinite(pos[1]) &&
        Math.abs(pos[0]) <= 90 &&
        Math.abs(pos[1]) <= 180
    );
}

// Función para obtener dirección desde coordenadas con Google Maps (Reverse Geocoding)
async function reverseGeocodeGoogle(lat, lng, callback) {
    if (!window.google) return;
    
    const geocoder = new window.google.maps.Geocoder();
    
    try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results[0]) {
            const components = response.results[0].address_components;
            
            const extract = (type) => {
                const comp = components.find(c => c.types.includes(type));
                return comp ? comp.long_name : '';
            };

            const address = {
                calle: extract('route'),
                numero_exterior: extract('street_number'),
                colonia: extract('sublocality') || extract('neighborhood'),
                ciudad: extract('locality'),
                estado: extract('administrative_area_level_1'),
                codigo_postal: extract('postal_code'),
            };
            callback(address);
        }
    } catch (error) {
        console.error('Error al obtener dirección de Google:', error);
    }
}

export default function MapaUbicacion({
    initialPosition = null,
    onPositionChange,
    onAddressChange,
    height = "400px"
}) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    const [map, setMap] = useState(null);
    const [position, setPosition] = useState(null);
    const [ubicacionCargando, setUbicacionCargando] = useState(true);
    const inicioAplicadoRef = useRef(false);

    const initialLat = initialPosition?.[0];
    const initialLng = initialPosition?.[1];

    // Obtener ubicación del dispositivo al cargar (Tu lógica original)
    useEffect(() => {
        if (!isLoaded) return;

        if (isValidLatLng([initialLat, initialLng])) {
            setPosition({ lat: initialLat, lng: initialLng });
            setUbicacionCargando(false);
            inicioAplicadoRef.current = true;
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const nuevaPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setPosition(nuevaPos);
                    
                    if (onPositionChange) onPositionChange(nuevaPos);
                    reverseGeocodeGoogle(nuevaPos.lat, nuevaPos.lng, handleAddressFound);
                    
                    setUbicacionCargando(false);
                    inicioAplicadoRef.current = true;
                },
                (error) => {
                    console.error('Error de geolocalización:', error);
                    const fallbackPos = { lat: 25.5428, lng: -103.4068 }; // Torreón por defecto
                    setPosition(fallbackPos);
                    
                    if (onPositionChange) onPositionChange(fallbackPos);
                    reverseGeocodeGoogle(fallbackPos.lat, fallbackPos.lng, handleAddressFound);
                    
                    setUbicacionCargando(false);
                    inicioAplicadoRef.current = true;
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            const fallbackPos = { lat: 25.5428, lng: -103.4068 };
            setPosition(fallbackPos);
            if (onPositionChange) onPositionChange(fallbackPos);
            setUbicacionCargando(false);
            inicioAplicadoRef.current = true;
        }
    }, [initialLat, initialLng, isLoaded]);

    // Sincronizar cambios externos
    useEffect(() => {
        if (!inicioAplicadoRef.current || !map) return;

        const externa = { lat: initialLat, lng: initialLng };
        if (!isValidLatLng([externa.lat, externa.lng]) || !position) return;

        const latDiff = Math.abs(position.lat - externa.lat);
        const lngDiff = Math.abs(position.lng - externa.lng);
        
        if (latDiff > 0.000001 || lngDiff > 0.000001) {
            setPosition(externa);
            map.panTo(externa);
        }
    }, [initialLat, initialLng, position, map]);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    const handlePositionChange = (newPos) => {
        setPosition(newPos);
        if (onPositionChange) {
            onPositionChange(newPos);
        }
        reverseGeocodeGoogle(newPos.lat, newPos.lng, handleAddressFound);
    };

    const onMarkerDragEnd = (e) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        handlePositionChange(newPos);
    };

    const onMapClick = (e) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        handlePositionChange(newPos);
    };

    const handleAddressFound = (address) => {
        if (onAddressChange) {
            onAddressChange(address);
        }
    };

    // Mostrar tu spinner original mientras carga la ubicación o el script de Google
    if (!isLoaded || ubicacionCargando || !position) {
        return (
            <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <p className="mt-2 text-sm text-gray-600">Obteniendo tu ubicación con Google...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden border border-gray-300 rounded-lg">
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: height }}
                center={position}
                zoom={16}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                }}
            >
                <Marker
                    position={position}
                    draggable={true}
                    onDragEnd={onMarkerDragEnd}
                />
            </GoogleMap>

            {/* Tu letrero de ayuda original */}
            <div className="absolute p-1 text-xs text-center text-gray-600 bg-white shadow-sm bg-opacity-90 rounded-xl bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 px-2 font-medium">
                    <FontAwesomeIcon icon={faLocationDot} className="text-blue-600" />
                    Arrastra el pin para ajustar la ubicación exacta
                </span>
            </div>
        </div>
    );
}