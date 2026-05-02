import 'dotenv/config.js';
import mongoose from 'mongoose';
import User from './models/User.js';

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const adminEmail = 'khaled_dev_admin@five.com';
        const adminPassword = 'khaledwaleed2001password';

        let adminUser = await User.findOne({ email: adminEmail });

        if (adminUser) {
            console.log('Admin user already exists. Updating role to ensure admin.');
            adminUser.isAdmin = true;
            await adminUser.save();
        } else {
            console.log('Creating new admin user...');
            adminUser = await User.create({
                email: adminEmail,
                passwordHash: adminPassword,
                isAdmin: true
            });
            console.log('Admin user created successfully.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
