# cinephoria-backend/Dockerfile
# Multi-stage build pour optimiser la taille de l'image finale

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copie des fichiers de dépendances 
COPY package*.json ./

# Installation des dépendances (incluant devDependencies pour le build)
RUN npm ci

# Copie du code source
COPY . .


# Nettoyage des devDependencies
RUN npm prune --production

# Stage 2: Production
FROM node:20-alpine

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copie uniquement les fichiers nécessaires depuis le builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --chown=nodejs:nodejs ./src ./src

# Passage à l'utilisateur non-root
USER nodejs

# Exposition du port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

  # Commande de démarrage
CMD ["node", "src/server.js"]