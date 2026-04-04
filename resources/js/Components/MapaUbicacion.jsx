import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faLocationDot } from '@fortawesome/free-solid-svg-icons';

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

// Componente para manejar eventos del mapa
function LocationMarker({ position, setPosition, onAddressFound }) {
    useMapEvents({
        click(e) {
            const nuevaPos = [e.latlng.lat, e.latlng.lng];
            if (!isValidLatLng(nuevaPos)) {
                return;
            }

            setPosition(nuevaPos);
            reverseGeocode(nuevaPos[0], nuevaPos[1], onAddressFound);
        },
    });

    return !isValidLatLng(position) ? null : (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend(e) {
                    const marker = e.target;
                    const newPos = marker.getLatLng();
                    const posicionArr = [newPos.lat, newPos.lng];
                    if (!isValidLatLng(posicionArr)) {
                        return;
                    }

                    setPosition(posicionArr);
                    reverseGeocode(newPos.lat, newPos.lng, onAddressFound);
                }
            }}
        />
    );
}

// Mantiene el viewport sincronizado y fuerza recálculo de tamaño para evitar mapa gris.
function MapViewportSync({ position }) {
    const map = useMap();

    useEffect(() => {
        if (!isValidLatLng(position)) {
            return;
        }

        map.setView(position, map.getZoom(), { animate: false });
        const t = setTimeout(() => map.invalidateSize(), 50);
        return () => clearTimeout(t);
    }, [map, position?.[0], position?.[1]]);

    return null;
}

// Función para obtener dirección desde coordenadas (reverse geocoding)
async function reverseGeocode(lat, lng, callback) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=mx`
        );
        const data = await response.json();

        if (data && data.address) {
            const address = {
                calle: data.address.road || data.address.pedestrian || '',
                numero_exterior: data.address.house_number || '',
                colonia: data.address.suburb || data.address.neighbourhood || '',
                ciudad: data.address.city || data.address.town || data.address.village || '',
                estado: data.address.state || '',
                codigo_postal: data.address.postcode || '',
            };
            callback(address);
        }
    } catch (error) {
        console.error('Error al obtener dirección:', error);
    }
}

// Componente de búsqueda de direcciones
function SearchControl({ setPosition, onAddressFound }) {
    const [searchText, setSearchText] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const searchAddress = async () => {
        if (!searchText.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1&countrycodes=mx`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setPosition([lat, lng]);
                reverseGeocode(lat, lng, onAddressFound);
            } else {
                alert('No se encontró la dirección');
            }
        } catch (error) {
            console.error('Error al buscar dirección:', error);
            alert('Error al buscar la dirección');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="absolute top-2 left-2 right-2 z-[1000] bg-white rounded-lg shadow-lg p-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
                    placeholder="Buscar dirección (calle, colonia, ciudad)..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="button"
                    onClick={searchAddress}
                    disabled={isSearching}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    <span className="inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        {isSearching ? 'Buscando...' : 'Buscar'}
                    </span>
                </button>
            </div>
        </div>
    );
}

// Componente principal
export default function MapaUbicacion({
    initialPosition = null,
    onPositionChange,
    onAddressChange,
    height = "400px"
}) {
    const [position, setPosition] = useState(null);
    const [ubicacionCargando, setUbicacionCargando] = useState(true);
    const inicioAplicadoRef = useRef(false);

    const initialLat = initialPosition?.[0];
    const initialLng = initialPosition?.[1];

    // Obtener ubicación del dispositivo al cargar
    useEffect(() => {
        // Si ya hay una posición inicial (por edición), usarla
        if (isValidLatLng([initialLat, initialLng])) {
            setPosition([initialLat, initialLng]);
            setUbicacionCargando(false);
            inicioAplicadoRef.current = true;
            return;
        }

        // Si no, intentar obtener la ubicación actual del dispositivo
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const nuevaPos = [pos.coords.latitude, pos.coords.longitude];
                    if (!isValidLatLng(nuevaPos)) {
                        setPosition([19.4326, -99.1332]);
                        setUbicacionCargando(false);
                        return;
                    }

                    setPosition(nuevaPos);
                    if (onPositionChange) {
                        onPositionChange({ lat: nuevaPos[0], lng: nuevaPos[1] });
                    }
                    reverseGeocode(nuevaPos[0], nuevaPos[1], handleAddressFound);
                    setUbicacionCargando(false);
                    inicioAplicadoRef.current = true;
                },
                (error) => {
                    console.error('Error de geolocalización:', error);
                    // Fallback a CDMX si no se puede obtener ubicación
                    setPosition([19.4326, -99.1332]);
                    if (onPositionChange) {
                        onPositionChange({ lat: 19.4326, lng: -99.1332 });
                    }
                    reverseGeocode(19.4326, -99.1332, handleAddressFound);
                    setUbicacionCargando(false);
                    inicioAplicadoRef.current = true;
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } else {
            // Fallback si el navegador no soporta geolocalización
            setPosition([19.4326, -99.1332]);
            if (onPositionChange) {
                onPositionChange({ lat: 19.4326, lng: -99.1332 });
            }
            reverseGeocode(19.4326, -99.1332, handleAddressFound);
            setUbicacionCargando(false);
            inicioAplicadoRef.current = true;
        }
    }, [initialLat, initialLng]);

    useEffect(() => {
        if (!inicioAplicadoRef.current) {
            return;
        }

        const externa = [initialLat, initialLng];
        if (!isValidLatLng(externa) || !isValidLatLng(position)) {
            return;
        }

        const latDiff = Math.abs(position[0] - externa[0]);
        const lngDiff = Math.abs(position[1] - externa[1]);
        if (latDiff < 0.000001 && lngDiff < 0.000001) {
            return;
        }

        setPosition(externa);
    }, [initialLat, initialLng, position]);

    const handlePositionChange = (newPos) => {
        if (!isValidLatLng(newPos)) {
            return;
        }

        setPosition(newPos);
        if (onPositionChange && newPos) {
            onPositionChange({ lat: newPos[0], lng: newPos[1] });
        }
    };

    const handleAddressFound = (address) => {
        if (onAddressChange) {
            onAddressChange(address);
        }
    };

    // Mostrar loading mientras carga la ubicación
    if (ubicacionCargando || !isValidLatLng(position)) {
        return (
            <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <p className="mt-2 text-sm text-gray-600">Obteniendo tu ubicación...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden border border-gray-300 rounded-lg">
            <SearchControl
                setPosition={(pos) => {
                    if (isValidLatLng(pos)) {
                        handlePositionChange(pos);
                    }
                }}
                onAddressFound={handleAddressFound}
            />
            <MapContainer
                center={position}
                zoom={15}
                style={{ height: height, width: '100%' }}
            >
                <MapViewportSync position={position} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    position={position}
                    setPosition={(pos) => {
                        if (isValidLatLng(pos)) {
                            handlePositionChange(pos);
                        }
                    }}
                    onAddressFound={handleAddressFound}
                />
            </MapContainer>
            <div className="absolute p-1 text-xs text-center text-gray-500 bg-white bg-opacity-75 rounded bottom-2 left-2 right-2">
                <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faLocationDot} />
                    Arrastra el pin para ajustar la ubicación | Haz clic en el mapa para mover el pin
                </span>
            </div>
        </div>
    );
}