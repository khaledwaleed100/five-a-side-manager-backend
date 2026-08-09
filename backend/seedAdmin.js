import 'dotenv/config.js';
import mongoose from 'mongoose';
import User from './models/User.js';

const seedAdmin = async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminSecurityAnswer = process.env.ADMIN_SECURITY_ANSWER || 'admin123';

    if (!adminEmail || !adminPassword) {
        console.error('❌  ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);

        let adminUser = await User.findOne({ email: adminEmail });

        if (adminUser) {
            console.log('Admin user already exists. Ensuring admin role...');
            adminUser.isAdmin = true;
            await adminUser.save();
            console.log('✅  Admin role confirmed.');
        } else {
            console.log('Creating new admin user...');
            adminUser = await User.create({
                email: adminEmail,
                passwordHash: adminPassword,
                securityQuestion: 'What is the admin override code?',
                securityAnswerHash: adminSecurityAnswer.toLowerCase().trim(),
                isAdmin: true
            });
            console.log('✅  Admin user created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
