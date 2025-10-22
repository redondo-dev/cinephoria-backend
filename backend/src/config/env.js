import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const currentEnv = process.env.NODE_ENV || 'development';

// Détermine le fichier à charger si nécessaire
const envFile =
  currentEnv === 'production' ? '.env.production' : '.env';

// Vérifie si les variables Render  existent déjà
if (!process.env.DB_HOST) {
  const envPath = path.resolve(process.cwd(), envFile);

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Variables chargées depuis ${envFile}`);
  } else {
    console.warn(`⚠️ Aucun fichier ${envFile} trouvé, utilisation des variables système`);
  }
} else {
  console.log('✅ Variables Render déjà présentes — aucun fichier .env chargé');
}

console.log(`📍 Environnement: ${currentEnv}`);
console.log(`🗄️  Base de données: ${process.env.DB_HOST}`);
console.log(`🔌 Port: ${process.env.PORT || 3000}`);
