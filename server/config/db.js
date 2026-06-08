const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    const error = new Error(
      'Missing MONGO_URI environment variable. Create server/.env from server/.env.example and set MONGO_URI.'
    );
    console.error('Database connection error:', error);
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Safely drop stale unique index in the conversations collection if present
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: 'conversations' }).toArray();
      if (collections.length > 0) {
        const conversationsCol = db.collection('conversations');
        const indexes = await conversationsCol.indexes();
        if (indexes.some((idx) => idx.name === 'visitor_1_targetRole_1')) {
          console.log('Dropping stale unique index visitor_1_targetRole_1 from conversations...');
          await conversationsCol.dropIndex('visitor_1_targetRole_1');
          console.log('Stale unique index dropped successfully.');
        }
      }
    } catch (indexErr) {
      console.warn('Non-blocking warning: Failed to check/drop stale conversation index:', indexErr.message);
    }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
