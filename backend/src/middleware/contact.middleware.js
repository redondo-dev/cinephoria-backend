// backend/src/middleware/contact.middleware.js
import { body, validationResult } from "express-validator";

// Le formulaire est public et n'authentifie personne : une page placée sur un autre site pourrait
// le faire envoyer par le navigateur de ses visiteurs, sans que le CORS s'y oppose, avec un
// formulaire HTML classique. Un tel formulaire ne peut pas envoyer du JSON : on n'accepte que lui.
const exigerJson = (req, res, next) => {
  if (!req.is("application/json")) {
    return res.status(415).json({
      success: false,
      errors: ["Le message doit être envoyé en JSON (Content-Type: application/json)."]
    });
  }
  next();
};

// Les textes ne sont pas échappés ici : l'échappement se fait une seule fois, à l'envoi de
// l'email (emailContact.js). Ici on vérifie le type, on retire les espaces et on contrôle la longueur.
export const validateContact = [
  exigerJson,

  body("nom")
    .optional()
    .isString().withMessage("Le nom doit être une chaîne de caractères.")
    .bail()
    .trim()
    .isLength({ max: 50 }).withMessage("Le nom ne doit pas dépasser 50 caractères."),

  body("email")
    .exists({ checkFalsy: true }).withMessage("L'email est obligatoire")
    .bail()
    .isString().withMessage("L'email doit être une chaîne de caractères.")
    .bail()
    .trim()
    .isEmail().withMessage("Email invalide")
    .bail()
    .customSanitizer(value => value.toLowerCase()),

  body("titre")
    .exists({ checkFalsy: true }).withMessage("Le titre est obligatoire.")
    .bail()
    .isString().withMessage("Le titre doit être une chaîne de caractères.")
    .bail()
    .trim()
    .isLength({ min: 5, max: 100 }).withMessage("Le titre doit contenir entre 5 et 100 caractères."),

  body("description")
    .exists({ checkFalsy: true }).withMessage("La description est obligatoire.")
    .bail()
    .isString().withMessage("La description doit être une chaîne de caractères.")
    .bail()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage("La description doit contenir entre 10 et 1000 caractères."),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];
