const axios = require('axios');
const captainModel = require('../models/captain.model');

const POSITIONSTACK_URL = 'http://api.positionstack.com/v1/forward';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const POSITIONSTACK_API_KEY = process.env.POSITIONSTACK_API_KEY;
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const requestHeaders = {
    'User-Agent': 'uber-clone-app/1.0',
};

const getCacheKey = (...parts) => parts.map(part => String(part).trim().toLowerCase()).join('|');

const getCached = (key) => {
    const cached = cache.get(key);

    if (!cached || cached.expiresAt < Date.now()) {
        cache.delete(key);
        return null;
    }

    return cached.value;
};

const setCached = (key, value) => {
    cache.set(key, {
        value,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
};

const normalizeProviderError = (error, fallbackMessage) => {
    const statusCode = error.response?.status;
    const message = statusCode === 429
        ? 'Map provider rate limit reached. Please wait a minute and try again.'
        : error.response?.data?.error?.message || error.message || fallbackMessage;

    const normalizedError = new Error(message);
    normalizedError.statusCode = statusCode || 500;
    return normalizedError;
};

module.exports.getAddressCoordinate = async (address) => {
    if (!address) {
        throw new Error('Address is required');
    }

    const cacheKey = getCacheKey('coordinate', address);
    const cached = getCached(cacheKey);

    if (cached) {
        return cached;
    }

    const url = `${POSITIONSTACK_URL}?access_key=${POSITIONSTACK_API_KEY}&query=${encodeURIComponent(address)}&limit=1`;

    try {
        const response = await axios.get(url, { headers: requestHeaders });
        const result = response.data.data[0];

        if (!result) {
            throw new Error(`Coordinates not found for address: ${address}`);
        }

        const coordinates = {
            lat: parseFloat(result.latitude),
            lng: parseFloat(result.longitude),
        };

        setCached(cacheKey, coordinates);
        return coordinates;
    } catch (error) {
        console.error('getAddressCoordinate error:', error.message || error);
        throw normalizeProviderError(error, 'Coordinates not found');
    }
};

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const cacheKey = getCacheKey('distance-time', origin, destination);
    const cached = getCached(cacheKey);

    if (cached) {
        return cached;
    }

    const originCoords = await module.exports.getAddressCoordinate(origin);
    const destinationCoords = await module.exports.getAddressCoordinate(destination);

    const url = `${OSRM_URL}/${originCoords.lng},${originCoords.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=false`;

    try {
        const response = await axios.get(url, { headers: requestHeaders });
        const route = response.data.routes?.[0];

        if (!route) {
            throw new Error('Route not found');
        }

        const distanceTime = {
            origin: originCoords,
            destination: destinationCoords,
            distance: route.distance,
            duration: route.duration,
        };

        setCached(cacheKey, distanceTime);
        return distanceTime;
    } catch (error) {
        console.error('getDistanceTime error:', error.message || error);
        throw normalizeProviderError(error, 'Route not found');
    }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const cacheKey = getCacheKey('suggestions', input);
    const cached = getCached(cacheKey);

    if (cached) {
        return cached;
    }

    const url = `${POSITIONSTACK_URL}?access_key=${POSITIONSTACK_API_KEY}&query=${encodeURIComponent(input)}&limit=5`;

    try {
        const response = await axios.get(url, { headers: requestHeaders });
        const suggestions = response.data.data.map(item => item.label).filter(Boolean);

        setCached(cacheKey, suggestions);
        return suggestions;
    } catch (error) {
        console.error('getAutoCompleteSuggestions error:', error.message || error);
        throw normalizeProviderError(error, 'Suggestions not found');
    }
};

module.exports.getCaptainsInTheRadius = async (lat, lng, radius) => {
    const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [ [ lng, lat ], radius / 6371 ]
            }
        }
    });

    return captains;
};
