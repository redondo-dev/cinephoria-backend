// tests/register.controller.test.js
import { jest } from "@jest/globals";

describe("Register Controller", () => {
  let register, registerWithTempPassword, User, bcrypt, jwt, sendTemporaryPassword;
  let req, res;

  beforeAll(async () => {
    // --- Mocks ---
    jest.unstable_mockModule("../src/models/user.model.js", () => ({
      default: {
        findOne: jest.fn(),
        create: jest.fn(),
      },
    }));

    jest.unstable_mockModule("bcrypt", () => ({
      hash: jest.fn(),
    }));

    jest.unstable_mockModule("jsonwebtoken", () => ({
      sign: jest.fn().mockReturnValue("fake-jwt-token"),
    }));

    jest.unstable_mockModule("../src/utils/sendTemporaryPassword.js", () => ({
      sendTemporaryPassword: jest.fn(),
    }));

    // --- Imports dynamiques après les mocks ---
    const controllerModule = await import("../src/controllers/auth/register.controller.js");
    register = controllerModule.register;
    registerWithTempPassword = controllerModule.registerWithTempPassword;

    User = (await import("../src/models/user.model.js")).default;
    bcrypt = await import("bcrypt");
    jwt = await import("jsonwebtoken");
    sendTemporaryPassword = (await import("../src/utils/sendTemporaryPassword.js")).sendTemporaryPassword;
  });

  beforeEach(() => {
    req = {
      body: {
        email: "john@example.com",
        password: "Password123!",
        prenom: "John",
        nom: "Doe",
        username: "johndoe",
        role_id: 4,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("devrait retourner 400 si champs manquants", async () => {
    req.body = {};
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("devrait retourner 400 si email invalide", async () => {
    req.body.email = "invalidemail";
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("devrait retourner 400 si mot de passe invalide", async () => {
    req.body.password = "short";
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("devrait retourner 400 si role_id invalide", async () => {
    req.body.role_id = 99; // rôle non valide
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("devrait créer un utilisateur avec succès", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashedPassword");
    User.create.mockResolvedValue({ id: 1, email: "john@example.com", username: "johndoe", role_id: 4, isConfirmed: false, mustChangePassword: false });

    await register(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 10);
    expect(User.create).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, process.env.JWT_SECRET, { expiresIn: "1d" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Compte créé avec succès",
        user: expect.objectContaining({ id: 1, email: "john@example.com", username: "johndoe" }),
        token: "fake-jwt-token",
      })
    );
  });
});
