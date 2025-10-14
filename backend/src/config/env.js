import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine which env file to use
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = resolve(__dirname, '../../', envFile);

// Fallback to .env if specific env file doesn't exist
const fallbackPath = resolve(__dirname, '../../.env');

let finalPath = envPath;

if (!existsSync(envPath)) {
  console.log(`⚠️  ${envFile} not found, trying .env`);
  if (existsSync(fallbackPath)) {
    finalPath = fallbackPath;
  } else {
    console.log('⚠️  No .env file found - using system environment variables');
    finalPath = null;
  }
}

// Load the env file if it exists
if (finalPath) {
  const result = config({ path: finalPath });
  
  if (result.error) {
    console.error(`❌ Erreur lors du chargement de ${finalPath}:`, result.error);
    console.log('⚠️  Continuing with system environment variables...');
  } else {
    console.log(`✅ Configuration chargée depuis: ${finalPath}`);
  }
}

console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
console.log(`🗄️  Base de données: ${process.env.DB_HOST || 'not set'}`);
console.log(`🔌 Port: ${process.env.PORT || 3000}`);

export default process.env;