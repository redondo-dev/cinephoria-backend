import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Rest of your code
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = resolve(__dirname, '../../', envFile);

// Charger le fichier .env
const result = config({ path: envPath });

if (result.error) {
  console.error(`❌ Erreur lors du chargement de ${envFile}:`, result.error);
  process.exit(1);
}

console.log(`✅ Configuration chargée depuis: ${envFile}`);
console.log(`📍 Environnement: ${process.env.NODE_ENV}`);
console.log(`🗄️  Base de données: ${process.env.DB_HOST}`);
console.log(`🔌 Port: ${process.env.PORT || 3000}`);

export default process.env;