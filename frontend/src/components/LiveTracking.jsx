import { useState, useEffect } from 'react'

const center = {
    lat: 28.6139,
    lng: 77.2090
};

const getOpenStreetMapUrl = ({ lat, lng }) => {
    const offset = 0.01
    const bbox = [
        lng - offset,
        lat - offset,
        lng + offset,
        lat + offset
    ].join(',')

    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`
}

const LiveTracking = () => {
    const [ currentPosition, setCurrentPosition ] = useState(center);

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

    return (
        <iframe
            title="Current location map"
            className="h-full w-full border-0"
            src={getOpenStreetMapUrl(currentPosition)}
            loading="lazy"
        />
    )
}

export default LiveTracking
