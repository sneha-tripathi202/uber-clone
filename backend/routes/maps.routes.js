const express = require('express');
const router = express.Router();
const authMiddleware =require('../middlewares/auth.middleware')
const { body, query } = require('express-validator');
const mapController = require('../controllers/map.controller');


router.get('/get-coordinates',
    authMiddleware.authUser,
    query('address').isString().isLength({ min: 3 }).withMessage('address query is required and must be at least 3 characters'),
    mapController.getCoordinates
);
router.get('/get-distance-time',
    authMiddleware.authUser,
    query('origin').isString().isLength({ min: 3 }).withMessage('origin query is required and must be at least 3 characters'),
    query('destination').isString().isLength({ min: 3 }).withMessage('destination query is required and must be at least 3 characters'),
    mapController.getDistanceTime
);
router.get('/get-suggestions',
    authMiddleware.authUser,
    query('input').isString().isLength({ min: 3 }).withMessage('input query is required and must be at least 3 characters'),
    mapController.getAutoCompleteSuggestions
);

module.exports = router;