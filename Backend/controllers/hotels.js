const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const mongoose = require('mongoose');

// @desc    Get all hotels
// @route   GET /api/v1/hotels
// @access  Public
exports.getHotels = async (req, res, next) => {
    try {
        // Build query
        const queryObj = { ...req.query };
        const removeFields = ['select', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete queryObj[param]);

        // Create query string
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Finding resource
        let query = Hotel.find(JSON.parse(queryStr)).populate('manager', 'name email');

        // Select fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Hotel.countDocuments();

        query = query.skip(startIndex).limit(limit);

        // Executing query
        const hotels = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: hotels.length,
            pagination,
            data: hotels
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single hotel
// @route   GET /api/v1/hotels/:id
// @access  Public
exports.getHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id).populate('rooms');

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create hotel
// @route   POST /api/v1/hotels
// @access  Private (Hotel Manager)
exports.createHotel = async (req, res, next) => {
    try {
        console.log('Creating hotel with data:', req.body);
        console.log('User making request:', req.user);
        
        // Validate user role
        if (req.user.role !== 'admin') {
            console.log('Unauthorized access attempt by user:', req.user.email);
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create hotels'
            });
        }

        // Add user to req.body
        req.body.manager = req.user.id;
        console.log('Added manager ID:', req.user.id);

        // Validate required fields
        if (!req.body.name || !req.body.description || !req.body.location?.address || !req.body.price) {
            console.log('Missing required fields:', {
                name: !!req.body.name,
                description: !!req.body.description,
                location: !!req.body.location?.address,
                price: !!req.body.price
            });
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields (name, description, location address, price)'
            });
        }

        // Validate price is a number
        if (isNaN(req.body.price)) {
            console.log('Invalid price value:', req.body.price);
            return res.status(400).json({
                success: false,
                message: 'Price must be a number'
            });
        }

        // Set default values for isFeatured and isActive if not provided
        if (req.body.isFeatured === undefined) {
            req.body.isFeatured = false;
        }
        if (req.body.isActive === undefined) {
            req.body.isActive = true;
        }

        const hotel = await Hotel.create(req.body);
        console.log('Hotel created successfully:', hotel);

        // Populate manager details
        await hotel.populate('manager', 'name email');

        res.status(201).json({
            success: true,
            data: hotel
        });
    } catch (err) {
        console.error('Error creating hotel:', err);
        console.error('Error stack:', err.stack);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            console.log('Validation errors:', messages);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: messages
            });
        }
        
        if (err.name === 'MongoError') {
            console.error('MongoDB error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred'
            });
        }

        res.status(500).json({
            success: false,
            message: err.message || 'Server Error'
        });
    }
};

// @desc    Update hotel
// @route   PUT /api/v1/hotels/:id
// @access  Private (Hotel Manager)
exports.updateHotel = async (req, res, next) => {
    try {
        let hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Make sure user is hotel manager or admin
        if (hotel.manager.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this hotel'
            });
        }

        // Create update object with only the fields that are provided
        const updateFields = {};
        
        // Handle basic fields
        if (req.body.name) updateFields.name = req.body.name;
        if (req.body.description) updateFields.description = req.body.description;
        if (req.body.price) updateFields.price = Number(req.body.price);
        if (req.body.amenities) updateFields.amenities = req.body.amenities;
        
        // Handle location
        if (req.body.location) {
            updateFields.location = {
                type: 'Point',
                coordinates: [0, 0],
                address: req.body.location.address || req.body.location
            };
        }

        // Handle address
        if (req.body.address) {
            updateFields.address = {
                ...hotel.address,
                ...req.body.address
            };
        }

        // Handle contact
        if (req.body.contact) {
            updateFields.contact = {
                ...hotel.contact,
                ...req.body.contact
            };
        }

        // Handle status fields - ensure they are boolean values
        if (req.body.isFeatured !== undefined) {
            updateFields.isFeatured = Boolean(req.body.isFeatured);
        }
        if (req.body.isActive !== undefined) {
            updateFields.isActive = Boolean(req.body.isActive);
        }

        // Handle manager assignment
        if (req.body.manager) {
            updateFields.manager = req.body.manager;
        }

        console.log('Updating hotel with fields:', updateFields);

        // Update the hotel
        hotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            {
                new: true,
                runValidators: true
            }
        ).populate('manager', 'name email');

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found after update'
            });
        }

        res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (err) {
        console.error('Error updating hotel:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: Object.values(err.errors).map(val => val.message)
            });
        }
        next(err);
    }
};

// @desc    Delete hotel
// @route   DELETE /api/v1/hotels/:id
// @access  Private (Hotel Manager, Admin)
exports.deleteHotel = async (req, res, next) => {
    try {
        console.log('Attempting to delete hotel with ID:', req.params.id);
        
        const hotel = await Hotel.findById(req.params.id);
        
        if (!hotel) {
            console.log('Hotel not found with ID:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        console.log('Found hotel:', hotel);
        console.log('Current user:', req.user);

        // Make sure user is hotel manager or admin
        if (hotel.manager.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log('Unauthorized delete attempt:', {
                hotelManager: hotel.manager.toString(),
                currentUser: req.user.id,
                userRole: req.user.role
            });
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this hotel'
            });
        }

        console.log('Attempting to delete hotel...');
        try {
            // First delete all rooms associated with this hotel
            await Room.deleteMany({ hotel: req.params.id });
            console.log('Deleted associated rooms');

            // Then delete the hotel
            const result = await Hotel.deleteOne({ _id: req.params.id });
            console.log('Delete result:', result);

            if (result.deletedCount === 0) {
                throw new Error('No hotel was deleted');
            }

            res.status(200).json({
                success: true,
                data: {}
            });
        } catch (deleteError) {
            console.error('Error during deletion:', deleteError);
            throw deleteError;
        }
    } catch (err) {
        console.error('Error in deleteHotel:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        res.status(500).json({
            success: false,
            message: 'Error deleting hotel',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// @desc    Get hotels within radius
// @route   GET /api/v1/hotels/radius/:zipcode/:distance
// @access  Public
exports.getHotelsInRadius = async (req, res, next) => {
    try {
        const { zipcode, distance } = req.params;

        // Get lat/lng from geocoder
        const loc = await geocoder.geocode(zipcode);
        const lat = loc[0].latitude;
        const lng = loc[0].longitude;

        // Calc radius using radians
        // Divide dist by radius of Earth
        // Earth Radius = 3,963 mi / 6,378 km
        const radius = distance / 3963;

        const hotels = await Hotel.find({
            'address.coordinates': {
                $geoWithin: { $centerSphere: [[lng, lat], radius] }
            }
        });

        res.status(200).json({
            success: true,
            count: hotels.length,
            data: hotels
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get featured hotels
// @route   GET /api/v1/hotels/featured
// @access  Public
exports.getFeaturedHotels = async (req, res, next) => {
    try {
        console.log('Fetching featured hotels');
        const hotels = await Hotel.find({ 
            isFeatured: true,
            isActive: true 
        })
        .select('name description location price rating image images amenities')
        .populate('manager', 'name email')
        .sort({ rating: -1, price: 1 })
        .limit(6);

        console.log(`Found ${hotels.length} featured hotels`);

        res.status(200).json({
            success: true,
            count: hotels.length,
            data: hotels
        });
    } catch (err) {
        console.error('Error fetching featured hotels:', err);
        next(err);
    }
};

// @desc    Assign manager to hotel
// @route   PUT /api/v1/hotels/:id/manager
// @access  Private (Admin)
exports.assignManager = async (req, res, next) => {
    try {
        const { managerEmail } = req.body;
        
        console.log('Assigning manager with email:', managerEmail);
        console.log('Hotel ID:', req.params.id);
        
        if (!managerEmail) {
            console.log('No manager email provided');
            return res.status(400).json({
                success: false,
                message: 'Please provide manager email'
            });
        }

        // Find user by email
        const User = mongoose.model('User');
        const manager = await User.findOne({ email: managerEmail });
        
        console.log('Found manager:', manager ? {
            id: manager._id,
            email: manager.email,
            role: manager.role
        } : 'Not found');
        
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }

        // Check if user has hotel_manager role
        if (manager.role !== 'hotel_manager') {
            console.log('User role is not hotel_manager:', manager.role);
            return res.status(400).json({
                success: false,
                message: 'User must be a hotel manager to be assigned to a hotel'
            });
        }

        const hotel = await Hotel.findById(req.params.id);
        
        console.log('Found hotel:', hotel ? {
            id: hotel._id,
            name: hotel.name,
            currentManager: hotel.manager
        } : 'Not found');
        
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Check if hotel already has a manager
        if (hotel.manager) {
            console.log('Hotel already has a manager:', hotel.manager);
            return res.status(400).json({
                success: false,
                message: 'Hotel already has a manager assigned'
            });
        }

        // Update hotel manager
        hotel.manager = manager._id;
        await hotel.save();

        // Populate manager details
        await hotel.populate('manager', 'name email');

        console.log('Successfully assigned manager to hotel:', {
            hotelId: hotel._id,
            managerId: manager._id
        });

        res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (err) {
        console.error('Error in assignManager:', err);
        next(err);
    }
};

// @desc    Search hotels with filters
// @route   GET /api/v1/hotels/search
// @access  Public
exports.searchHotels = async (req, res, next) => {
    try {
        const { location, minPrice, maxPrice, amenities } = req.query;
        
        console.log('Search Query Parameters:', {
            location,
            minPrice,
            maxPrice,
            amenities,
            allQueryParams: req.query
        });
        
        // Build query object
        const queryObj = { isActive: true };
        
        // Add location filter if provided
        if (location) {
            queryObj['location.address'] = { 
                $regex: location, 
                $options: 'i' 
            };
            console.log('Location filter added:', queryObj['location.address']);
        }
        
        // Add amenities filter if provided
        if (amenities) {
            const amenityList = amenities.split(',');
            queryObj.amenities = { $all: amenityList };
            console.log('Amenities filter added:', queryObj.amenities);
        }
        
        console.log('Final MongoDB Query:', JSON.stringify(queryObj, null, 2));
        
        // Find hotels matching the criteria
        let hotels = await Hotel.find(queryObj)
            .populate('manager', 'name email')
            .populate('rooms', 'price');
            
        console.log('Found Hotels Count:', hotels.length);
        console.log('Sample Hotel Data:', hotels.length > 0 ? {
            name: hotels[0].name,
            address: hotels[0].location?.address,
            amenities: hotels[0].amenities,
            rooms: hotels[0].rooms?.length
        } : 'No hotels found');
        
        // Filter hotels based on room price range
        if (minPrice || maxPrice) {
            hotels = hotels.filter(hotel => {
                if (!hotel.rooms || hotel.rooms.length === 0) {
                    console.log(`Hotel ${hotel.name} has no rooms`);
                    return false;
                }
                
                const minRoomPrice = Math.min(...hotel.rooms.map(room => room.price));
                const maxRoomPrice = Math.max(...hotel.rooms.map(room => room.price));
                
                console.log(`Hotel ${hotel.name} price range: ${minRoomPrice} - ${maxRoomPrice}`);
                
                if (minPrice && minRoomPrice < Number(minPrice)) {
                    console.log(`Hotel ${hotel.name} filtered out - min price too low`);
                    return false;
                }
                if (maxPrice && maxRoomPrice > Number(maxPrice)) {
                    console.log(`Hotel ${hotel.name} filtered out - max price too high`);
                    return false;
                }
                
                return true;
            });
            
            console.log('Hotels after price filtering:', hotels.length);
        }
        
        // Sort hotels by rating (highest first) and minimum room price (lowest first)
        hotels.sort((a, b) => {
            if (a.rating !== b.rating) {
                return b.rating - a.rating;
            }
            
            const aMinPrice = a.rooms && a.rooms.length > 0 
                ? Math.min(...a.rooms.map(room => room.price))
                : a.price;
            const bMinPrice = b.rooms && b.rooms.length > 0 
                ? Math.min(...b.rooms.map(room => room.price))
                : b.price;
                
            return aMinPrice - bMinPrice;
        });
        
        console.log('Final response data:', {
            count: hotels.length,
            sampleData: hotels.length > 0 ? {
                name: hotels[0].name,
                price: hotels[0].rooms?.[0]?.price
            } : 'No hotels'
        });
        
        res.status(200).json({
            success: true,
            count: hotels.length,
            data: hotels
        });
    } catch (err) {
        console.error('Error in searchHotels:', err);
        console.error('Error stack:', err.stack);
        next(err);
    }
};

// @desc    Upload hotel images
// @route   POST /api/v1/hotels/:id/images
// @access  Private (Hotel Manager)
exports.uploadImages = async (req, res, next) => {
    try {
        console.log('Uploading images for hotel:', {
            hotelId: req.params.id,
            files: req.files,
            user: req.user
        });

        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            console.log('Hotel not found:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Make sure user is hotel manager
        if (hotel.manager.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log('Unauthorized access attempt:', {
                hotelManager: hotel.manager.toString(),
                currentUser: req.user.id,
                userRole: req.user.role
            });
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this hotel'
            });
        }

        if (!req.files || req.files.length === 0) {
            console.log('No files uploaded');
            return res.status(400).json({
                success: false,
                message: 'Please upload at least one image'
            });
        }

        // Prepare images array
        const images = req.files.map(file => ({
            filename: file.filename,
            url: `/uploads/hotels/${file.filename}`
        }));

        console.log('Prepared images:', images);

        // Get existing images and ensure they're in the correct format
        const existingImages = (hotel.images || []).map(image => {
            if (typeof image === 'string') {
                return {
                    filename: image,
                    url: `/uploads/hotels/${image}`
                };
            }
            return image;
        });

        // Add new images to hotel
        hotel.images = [...existingImages, ...images];
        
        // Validate the hotel document before saving
        try {
            await hotel.validate();
        } catch (validationError) {
            console.error('Validation error:', validationError);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: Object.values(validationError.errors).map(val => val.message)
            });
        }

        await hotel.save();

        console.log('Hotel updated successfully:', {
            hotelId: hotel._id,
            imageCount: hotel.images.length
        });

        res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (err) {
        console.error('Error uploading images:', {
            error: err.message,
            stack: err.stack,
            hotelId: req.params.id
        });
        
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: Object.values(err.errors).map(val => val.message)
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error uploading images',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}; 