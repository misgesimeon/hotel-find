const mongoose = require('mongoose');
const User = require('../models/User');

const migrateRoles = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Update all users with hotel_owner role to hotel_manager
        const result = await User.updateMany(
            { role: 'hotel_owner' },
            { $set: { role: 'hotel_manager' } }
        );

        console.log(`Updated ${result.nModified} users from hotel_owner to hotel_manager`);

        // Close the connection
        await mongoose.connection.close();
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateRoles(); 