// backend/src/routes/contact.routes.js
import express from "express";
import { postContact } from "../controllers/contact.controller.js";
import { validateContact } from "../middlewares/contact.middleware.js";

const router = express.Router();


router.post('/send',validateContact, postContact);
   
export default router;