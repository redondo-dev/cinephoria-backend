// src/routes/auth.routes.js
import express from "express";
import { login, logout } from "../../controllers/auth.controller.js";

const router = express.Router();



// nouvelles routes
router.post("/login", login);
router.post("/logout", logout);

export default router;
