import { jest } from '@jest/globals';

// Mocks avant les imports
const mockUserModel = {
  findOne: jest.fn()
};

const mockBcrypt = {
  compare: jest.fn()
};

const mockJwt = {
  sign: jest.fn()
};

// Mock les modules avant import
jest.unstable_mockModule('../src/models/user.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: mockBcrypt,
  ...mockBcrypt
}));
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJwt,
  ...mockJwt
}));

// Import après les mocks
const { login, logout } = await import('../src/controllers/auth.controller.js');

describe('Auth Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = { body: {} };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
  });

  describe('login', () => {
    test('devrait retourner une erreur 400 si email ou password manquant', async () => {
      mockReq.body = { email: 'test@example.com' }; // password manquant
      
      await login(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Email et mot de passe requis'
      });
    });

    test('devrait retourner une erreur 401 si utilisateur introuvable', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };
      
      mockUserModel.findOne.mockResolvedValue(null); // Utilisateur non trouvé
      
      await login(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Identifiants invalides'
      });
    });

    test('devrait retourner une erreur 401 si mot de passe incorrect', async () => {
      mockReq.body = { email: 'test@example.com', password: 'wrongpassword' };
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false); // Mot de passe incorrect
      
      await login(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Identifiants invalides'
      });
    });

    test('devrait connecter avec succès avec des identifiants valides', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('fake.jwt.token');
      
      await login(mockReq, mockRes);
      
      expect(mockRes.cookie).toHaveBeenCalledWith('auth_token', 'fake.jwt.token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Connexion réussie'
      });
    });

    test('devrait retourner une erreur 500 en cas d\'erreur serveur', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };
      
      mockUserModel.findOne.mockRejectedValue(new Error('Erreur DB'));
      
      await login(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Erreur DB'
      });
    });
  });

  describe('logout', () => {
    test('devrait déconnecter et supprimer le cookie', () => {
      logout(mockReq, mockRes);
      
      expect(mockRes.clearCookie).toHaveBeenCalledWith('auth_token');
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Déconnexion réussie'
      });
    });
  });
});