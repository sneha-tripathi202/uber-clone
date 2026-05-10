import React, { useState, useEffect, useCallback } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    lat: -3.745,
    lng: -38.523
};

const libraries = [ 'marker' ];

const LiveTracking = () => {
    const [ currentPosition, setCurrentPosition ] = useState(center);
    const [ map, setMap ] = useState(null);
    const [ marker, setMarker ] = useState(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries
    });

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({
                lat: latitude,
                lng: longitude
            });
        });

        const watchId = navigator.geolocation.watchPosition((position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({
                lat: latitude,
                lng: longitude
            });
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        const updatePosition = () => {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;

                console.log('Position updated:', latitude, longitude);
                setCurrentPosition({
                    lat: latitude,
                    lng: longitude
                });
            });
        };

        updatePosition(); // Initial position update

        const intervalId = setInterval(updatePosition, 10000); // Update every 10 seconds

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!isLoaded || !map) return;

        if (!marker) {
            const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
                map,
                position: currentPosition
            });
            setMarker(advancedMarker);
            return;
        }

        marker.position = currentPosition;
    }, [isLoaded, map, marker, currentPosition]);

    const onLoad = useCallback((loadedMap) => {
        setMap(loadedMap);
    }, []);

    const onUnmount = useCallback(() => {
        if (marker) {
            marker.map = null;
            setMarker(null);
        }
        setMap(null);
    }, [marker]);

    if (!isLoaded) return null;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={currentPosition}
            zoom={15}
            onLoad={onLoad}
            onUnmount={onUnmount}
        />
    )
}

export default LiveTracking