import { useEffect, useMemo, useRef, useState } from 'react'

const center = {
    lat: 28.6139,
    lng: 77.2090
};

const TILE_SIZE = 256
const DEFAULT_ZOOM = 14

const lonLatToWorld = ({ lat, lng }, zoom) => {
    const scale = TILE_SIZE * Math.pow(2, zoom)
    const sinLat = Math.sin((lat * Math.PI) / 180)

    return {
        x: ((lng + 180) / 360) * scale,
        y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
    }
}

const worldToTile = (value) => Math.floor(value / TILE_SIZE)

const clampTile = (tile, zoom) => {
    const maxTile = Math.pow(2, zoom) - 1
    return Math.min(Math.max(tile, 0), maxTile)
}

const getRouteCenter = (points) => {
    if (!points.length) return center

    const bounds = points.reduce((acc, point) => ({
        minLat: Math.min(acc.minLat, point.lat),
        maxLat: Math.max(acc.maxLat, point.lat),
        minLng: Math.min(acc.minLng, point.lng),
        maxLng: Math.max(acc.maxLng, point.lng),
    }), {
        minLat: points[0].lat,
        maxLat: points[0].lat,
        minLng: points[0].lng,
        maxLng: points[0].lng,
    })

    return {
        lat: (bounds.minLat + bounds.maxLat) / 2,
        lng: (bounds.minLng + bounds.maxLng) / 2,
    }
}

const getZoomForPoints = (points) => {
    if (points.length < 2) return DEFAULT_ZOOM

    const latSpread = Math.max(...points.map(point => point.lat)) - Math.min(...points.map(point => point.lat))
    const lngSpread = Math.max(...points.map(point => point.lng)) - Math.min(...points.map(point => point.lng))
    const spread = Math.max(latSpread, lngSpread)

    if (spread > 1) return 8
    if (spread > 0.5) return 9
    if (spread > 0.2) return 11
    if (spread > 0.08) return 12
    return 14
}

const MarkerPin = ({ point, origin, zoom, label, className }) => {
    if (!point) return null

    const world = lonLatToWorld(point, zoom)

    return (
        <div
            className={`absolute -translate-x-1/2 -translate-y-full rounded-full px-2 py-1 text-xs font-semibold text-white shadow-lg ${className}`}
            style={{
                left: world.x - origin.x,
                top: world.y - origin.y,
            }}
        >
            {label}
        </div>
    )
}

const LiveTracking = ({ pickupLocation, destinationLocation, routePath = [] }) => {
    const [ currentPosition, setCurrentPosition ] = useState(center);
    const [ mapSize, setMapSize ] = useState({ width: 0, height: 0 })
    const mapRef = useRef(null)

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
        if (!mapRef.current) return

        const observer = new ResizeObserver(([ entry ]) => {
            setMapSize({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            })
        })

        observer.observe(mapRef.current)
        return () => observer.disconnect()
    }, [])

    const mapPoints = useMemo(() => {
        const points = routePath.length ? [ ...routePath ] : []

        if (pickupLocation) points.push(pickupLocation)
        if (destinationLocation) points.push(destinationLocation)
        if (!points.length) points.push(currentPosition)

        return points
    }, [ currentPosition, destinationLocation, pickupLocation, routePath ])

    const zoom = getZoomForPoints(mapPoints)
    const mapCenter = getRouteCenter(mapPoints)
    const centerWorld = lonLatToWorld(mapCenter, zoom)
    const origin = {
        x: centerWorld.x - mapSize.width / 2,
        y: centerWorld.y - mapSize.height / 2,
    }

    const tiles = []
    if (mapSize.width && mapSize.height) {
        const startTileX = worldToTile(origin.x) - 1
        const endTileX = worldToTile(origin.x + mapSize.width) + 1
        const startTileY = worldToTile(origin.y) - 1
        const endTileY = worldToTile(origin.y + mapSize.height) + 1

        for (let x = startTileX; x <= endTileX; x += 1) {
            for (let y = startTileY; y <= endTileY; y += 1) {
                tiles.push({
                    x: clampTile(x, zoom),
                    y: clampTile(y, zoom),
                    left: x * TILE_SIZE - origin.x,
                    top: y * TILE_SIZE - origin.y,
                })
            }
        }
    }

    const routePoints = routePath
        .map(point => {
            const world = lonLatToWorld(point, zoom)
            return `${world.x - origin.x},${world.y - origin.y}`
        })
        .join(' ')

    return (
        <div ref={mapRef} className="relative h-full w-full overflow-hidden bg-[#dbe7df]">
            {tiles.map((tile, idx) => (
                <img
                    key={`${tile.x}-${tile.y}-${idx}`}
                    alt=""
                    className="absolute h-64 w-64 select-none"
                    draggable="false"
                    src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
                    style={{ left: tile.left, top: tile.top }}
                />
            ))}

            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                {routePoints && (
                    <polyline
                        points={routePoints}
                        fill="none"
                        stroke="#111827"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="6"
                    />
                )}
                {routePoints && (
                    <polyline
                        points={routePoints}
                        fill="none"
                        stroke="#22c55e"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                    />
                )}
            </svg>

            <MarkerPin point={pickupLocation || (!destinationLocation ? currentPosition : null)} origin={origin} zoom={zoom} label={pickupLocation ? 'Pickup' : 'You'} className="bg-black" />
            <MarkerPin point={destinationLocation} origin={origin} zoom={zoom} label="Drop" className="bg-emerald-600" />
        </div>
    )
}

export default LiveTracking
