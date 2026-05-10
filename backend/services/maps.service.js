const axios = require('axios');
const captainModel = require('../models/captain.model');

const POSITIONSTACK_URL = 'http://api.positionstack.com/v1/forward';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const POSITIONSTACK_API_KEY = process.env.POSITIONSTACK_API_KEY;

const requestHeaders = {
    'User-Agent': 'uber-clone-app/1.0',
};

module.exports.getAddressCoordinate = async (address) => {
    if (!address) {
        throw new Error('Address is required');
    }

    const url = `${POSITIONSTACK_URL}?access_key=${POSITIONSTACK_API_KEY}&query=${encodeURIComponent(address)}&limit=1`;

    try {
        const response = await axios.get(url, { headers: requestHeaders });
        const result = response.data.data[0];

        if (!result) {
            throw new Error(`Coordinates not found for address: ${address}`);
        }

        return {
            lat: parseFloat(result.latitude),
            lng: parseFloat(result.longitude),
        };
    } catch (error) {
        console.error('getAddressCoordinate error:', error.message || error);
        throw error;
    }
};

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
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

        return {
            origin: originCoords,
            destination: destinationCoords,
            distance: route.distance,
            duration: route.duration,
        };
    } catch (error) {
        console.error('getDistanceTime error:', error.message || error);
        throw error;
    }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const url = `${POSITIONSTACK_URL}?access_key=${POSITIONSTACK_API_KEY}&query=${encodeURIComponent(input)}&limit=5`;

    try {
        const response = await axios.get(url, { headers: requestHeaders });
        return response.data.data.map(item => item.label).filter(Boolean);
    } catch (error) {
        console.error('getAutoCompleteSuggestions error:', error.message || error);
        throw error;
    }
};

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [ [ ltd, lng ], radius / 6371 ]
            }
        }
    });

    return captains;
};
