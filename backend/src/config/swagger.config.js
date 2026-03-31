// src/config/swagger.js
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

//  Options de configuration Swagger (JSDoc)
const options = {
  definition: {
    openapi: "3.0.3", // Version OpenAPI utilisée
    info: {
      title: "Cinéphoria API", // Nom de ton projet
      version: "1.0.0",
      description:
        "Documentation de l’API REST Cinéphoria (Node.js, Express, PostgreSQL)",
      contact: {
        name: "Redondo",
        email: "contact@cinephoria.fr",
      },
    },

    //  Serveurs disponibles
    servers: [
      {
        url: "http://localhost:3000",
        description: "Serveur local",
      },
     
    ],

    // Schémas de sécurité (JWT)
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    //Sécurité globale 
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  // Chemins vers tes fichiers de routes/commentaires JSDoc
  apis: ["./src/routes/**/*.js", "./src/routes/*.js"],
};

//  Création du spécification Swagger (au format JSON)
const swaggerSpec = swaggerJsdoc(options);

// Fonction utilitaire pour servir la doc via Swagger UI
 function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📘 Documentation Swagger disponible sur : http://localhost:3000/api-docs");
}

export default setupSwagger;
export { swaggerSpec };
