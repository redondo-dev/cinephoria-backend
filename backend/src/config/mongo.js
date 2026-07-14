import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI ou MONGO_URI non défini dans .env');
    }
    
   
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10,
      dbName: process.env.MONGO_DB_NAME || 'cinephoria',
    });
    
  
   
    
 if (process.env.NODE_ENV === "production") {
      console.log("MongoDB connecté **en PRODUCTION**");
    } else {
      console.log("MongoDB connecté en MODE DEV");
    }



    // Événements
    mongoose.connection.on('error', (err) => {
      console.error(' Erreur MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn(' MongoDB déconnecté');
    });
    
  } catch (error) {
    console.error('Erreur connexion MongoDB:', error.message);
    throw error; // Important pour que startServer() attrape l'erreur
  }
};