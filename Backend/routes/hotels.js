const express = require('express');
const {
    getHotels,
    getHotel,
    createHotel,
    updateHotel,
    deleteHotel,
    getHotelsInRadius,
    getFeaturedHotels,
    assignManager,
    searchHotels,
    uploadImages
} = require('../controllers/hotels');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/radius/:zipcode/:distance')
    .get(getHotelsInRadius);

router.route('/search')
    .get(searchHotels);

router.route('/featured')
    .get(getFeaturedHotels);

// Main hotel routes
router.route('/')
    .get(getHotels)
    .post(protect, authorize('admin'), createHotel); // Only admin can create hotels

router.route('/:id')
    .get(getHotel)
    .put(protect, authorize('admin', 'hotel_manager'), updateHotel)
    .delete(protect, authorize('admin'), deleteHotel);

router.route('/:id/manager')
    .put(protect, authorize('admin'), assignManager);

// Upload images for a hotel
router.route('/:id/images')
    .post(protect, authorize('admin', 'hotel_manager'), upload.array('images', 5), uploadImages);

module.exports = router; 