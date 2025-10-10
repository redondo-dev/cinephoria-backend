// backend/src/routes/contact.routes.js
import express from "express";
import { postContact } from "../controllers/contact/contact.controller.js";
import { validateContact } from "../middleware/contact.middleware.js";

const router = express.Router();


router.post('/send',validateContact, postContact);
   
export default router;