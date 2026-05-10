const axios = require('axios');
const captainModel = require('../models/captain.model');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
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

const getProviderError = (response) => response?.data?.error;

const isRateLimitError = (statusCode, providerError, message = '') => {
    const providerCode = String(providerError?.code || '').toLowerCase();
    const providerMessage = String(providerError?.message || message).toLowerCase();

    return statusCode === 429
        || providerCode.includes('limit')
        || providerCode.includes('quota')
        || providerMessage.includes('rate limit')
        || providerMessage.includes('usage limit')
        || providerMessage.includes('quota');
};

const normalizeProviderError = (error, fallbackMessage) => {
    if (error.statusCode) {
        return error;
    }

    const statusCode = error.response?.status;
    const providerError = getProviderError(error.response);
    const message = statusCode === 429
        || isRateLimitError(statusCode, providerError, error.message)
        ? 'Map provider rate limit reached. Please wait a minute and try again.'
        : providerError?.message || error.message || fallbackMessage;

    const normalizedError = new Error(message);
    normalizedError.statusCode = isRateLimitError(statusCode, providerError, message) ? 429 : statusCode || 500;
    return normalizedError;
};

const throwIfProviderError = (response, fallbackMessage) => {
    const providerError = getProviderError(response);

    if (!providerError) {
        return;
    }

    throw normalizeProviderError({ response }, fallbackMessage);
};

const getProviderData = (response) => Array.isArray(response?.data?.data) ? response.data.data : [];

const searchNominatim = async (query, limit = 5) => {
    const response = await axios.get(NOMINATIM_URL, {
        params: {
            q: query,
            format: 'jsonv2',
            addressdetails: 1,
            limit,
        },
        headers: requestHeaders,
    });

    return Array.isArray(response.data) ? response.data : [];
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

    try {
        const result = (await searchNominatim(address, 1))[0];

        if (!result) {
            throw new Error(`Coordinates not found for address: ${address}`);
        }

        const coordinates = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        };

        setCached(cacheKey, coordinates);
        return coordinates;
    } catch (error) {
        console.error('getAddressCoordinate nominatim error:', error.message || error);

        if (!POSITIONSTACK_API_KEY) {
            throw normalizeProviderError(error, 'Coordinates not found');
        }

        const url = `${POSITIONSTACK_URL}?access_key=${POSITIONSTACK_API_KEY}&query=${encodeURIComponent(address)}&limit=1`;

        try {
            const response = await axios.get(url, { headers: requestHeaders });
            throwIfProviderError(response, 'Coordinates not found');

            const result = getProviderData(response)[0];

            if (!result) {
                throw new Error(`Coordinates not found for address: ${address}`);
            }

            const coordinates = {
                lat: parseFloat(result.latitude),
                lng: parseFloat(result.longitude),
            };

            setCached(cacheKey, coordinates);
            return coordinates;
        } catch (fallbackError) {
            console.error('getAddressCoordinate fallback error:', fallbackError.message || fallbackError);
            throw normalizeProviderError(fallbackError, 'Coordinates not found');
        }
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

    try {
        const suggestions = (await searchNominatim(input, 5))
            .map(item => item.display_name)
            .filter(Boolean);

        setCached(cacheKey, suggestions);
        return suggestions;
    } catch (error) {
        console.error('getAutoCompleteSuggestions nominatim error:', error.message || error);

        if (!POSITIONSTACK_API_KEY) {
            throw normalizeProviderError(error, 'Suggestions not found');
        }

        const url = `${POSITIONSTACK_URL}?access_key=${POSITIONSTACK_API_KEY}&query=${encodeURIComponent(input)}&limit=5`;

        try {
            const response = await axios.get(url, { headers: requestHeaders });
            throwIfProviderError(response, 'Suggestions not found');

            const suggestions = getProviderData(response)
                .map(item => item.label || item.name || item.locality || item.region)
                .filter(Boolean);

            setCached(cacheKey, suggestions);
            return suggestions;
        } catch (fallbackError) {
            console.error('getAutoCompleteSuggestions fallback error:', fallbackError.message || fallbackError);
            throw normalizeProviderError(fallbackError, 'Suggestions not found');
        }
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
