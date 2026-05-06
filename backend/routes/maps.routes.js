const express = require('express');
const router = express.Router();
const authMiddleware =require('../middlewares/auth.middleware')
const { body, query } = require('express-validator');
const mapController = require('../controllers/map.controller');
// const authMiddleware = require('../middlewares/auth.middleware');


// router.post('/create',
//     authMiddleware.authUser,
//     body('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
//     body('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
//     body('vehicleType').isString().isIn([ 'auto', 'car', 'moto' ]).withMessage('Invalid vehicle type'),
//     rideController.createRide
// )

// router.get('/get-fare',
//     authMiddleware.authUser,
//     query('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
//     query('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
//     rideController.getFare
// )

// router.post('/confirm',
//     authMiddleware.authCaptain,
//     body('rideId').isMongoId().withMessage('Invalid ride id'),
//     rideController.confirmRide
// )

// router.get('/start-ride',
//     authMiddleware.authCaptain,
//     query('rideId').isMongoId().withMessage('Invalid ride id'),
//     query('otp').isString().isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
//     rideController.startRide
// )

// router.post('/end-ride',
//     authMiddleware.authCaptain,
//     body('rideId').isMongoId().withMessage('Invalid ride id'),
//     rideController.endRide
// )
router.get('/get-coordinates',
    authMiddleware.authUser,
    query('address').isString().isLength({ min: 3 }),
    authMiddleware.authUser,mapController.getCoordinates
);
router.get('/get-distance-time',
    query('origin').isString().isLength({ min: 3 }),
    query('destination').isString().isLength({ min: 3 }),
    authMiddleware.authUser,
    mapController.getDistanceTime
);
router.get('/get-suggestions',
    query('input').isString().isLength({ min: 3 }),
    query('destination').isString().isLength({ min: 3 }),
    authMiddleware.authUser,
    mapController.getAutoCompleteSuggestions
);

module.exports = router;