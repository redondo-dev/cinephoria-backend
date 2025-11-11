// backend/src/middleware/contact.middleware.js
import { body, validationResult } from "express-validator";
import xss from "xss";

export const validateContact = [
  body("nom")
    .optional()
    .isString().withMessage("Le nom doit être une chaîne de caractères.")
    .isLength({ max: 50 }).withMessage("Le nom ne doit pas dépasser 50 caractères.")
     .customSanitizer(value => value ? xss(value.trim()) : ''),

 // Vérifie et nettoie l'email
  body('email')
  .exists({ checkFalsy: true }).withMessage('L’email est obligatoire')
    .isEmail().withMessage('Email invalide')
    .bail()
    .customSanitizer(value => (value ? value.trim().toLowerCase() : '')),



  body("titre")
    .notEmpty().withMessage("Le titre est obligatoire.")
    .isLength({ min: 5, max: 100 }).withMessage("Le titre doit contenir entre 5 et 100 caractères.")
    .customSanitizer(value => value ? xss(value.trim()) : ''),

  body("description")
    .notEmpty().withMessage("La description est obligatoire.")
    .isLength({ min: 10, max: 1000 }).withMessage("La description doit contenir entre 10 et 1000 caractères.")
  .customSanitizer(value => value ? xss(value.trim()) : ''),

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
