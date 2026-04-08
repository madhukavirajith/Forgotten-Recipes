// server/scripts/initSystemUsers.js
// Run this once to create your system users (admin, headchef, dietician)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const initSystemUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // System users data
    const systemUsers = [
      {
        name: 'System Admin',
        email: 'admin@forgottenrecipes.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'Head Chef',
        email: 'headchef@forgottenrecipes.com',
        password: 'chef123',
        role: 'headchef'
      },
      {
        name: 'System Dietician',
        email: 'dietician@forgottenrecipes.com',
        password: 'dietician123',
        role: 'dietician'
      }
    ];

    for (const userData of systemUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Create user
        await User.create({
          ...userData,
          password: hashedPassword
        });
        
        console.log(`✓ Created ${userData.role}: ${userData.email}`);
      } else {
        console.log(`- ${userData.role} already exists: ${userData.email}`);
      }
    }

    console.log('\n🎉 System initialization complete!');
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@forgottenrecipes.com / admin123');
    console.log('Head Chef: headchef@forgottenrecipes.com / chef123');
    console.log('Dietician: dietician@forgottenrecipes.com / dietician123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing system users:', error);
    process.exit(1);
  }
};

initSystemUsers();