import jwt from 'jsonwebtoken';
import { UserService } from './userService';
import { FaceService } from './faceService';
import { getDatabase } from '../database/database';
import { LoginRequest, FaceLoginRequest, AuthResponse, UserResponse } from '../models/User';

export class AuthService {
  private userService = new UserService();
  private faceService = new FaceService();
  private get db() {
    return getDatabase();
  }
  
  // Clé secrète JWT (en production, utilisez une variable d'environnement)
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = '24h';

  async loginWithPassword(loginData: LoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      if (!loginData.password) {
        return {
          success: false,
          message: 'Mot de passe requis'
        };
      }

      // Rechercher l'utilisateur par email ou nom d'utilisateur
      let user = null;
      if (loginData.email) {
        user = await this.userService.getUserByEmail(loginData.email);
      } else if (loginData.username) {
        user = await this.userService.getUserByUsername(loginData.username);
      }

      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      // Vérifier le mot de passe
      const isPasswordValid = await this.userService.verifyPassword(loginData.password, user.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Mot de passe incorrect'
        };
      }

      // Créer le token JWT
      const token = this.generateToken(user.id!);

      // Enregistrer la session de connexion
      await this.logLoginSession(user.id!, 'password', ipAddress, userAgent);

      // Récupérer les données utilisateur sans le mot de passe
      const userResponse = await this.userService.getUserById(user.id!);

      return {
        success: true,
        token,
        user: userResponse!,
        message: 'Connexion réussie'
      };
    } catch (error) {
      console.error('Error in password login:', error);
      return {
        success: false,
        message: 'Erreur lors de la connexion'
      };
    }
  }

  async loginWithFace(faceLoginData: FaceLoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      if (!this.faceService.isValidFaceDescriptor(faceLoginData.faceDescriptor)) {
        return {
          success: false,
          message: 'Données de reconnaissance faciale invalides'
        };
      }

      // Authentifier par reconnaissance faciale
      const faceAuth = await this.faceService.authenticateByFace(faceLoginData.faceDescriptor);
      
      if (!faceAuth) {
        return {
          success: false,
          message: 'Visage non reconnu'
        };
      }

      // Récupérer les données utilisateur
      const user = await this.userService.getUserById(faceAuth.userId);
      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      // Créer le token JWT
      const token = this.generateToken(user.id);

      // Enregistrer la session de connexion
      await this.logLoginSession(user.id, 'face', ipAddress, userAgent);

      return {
        success: true,
        token,
        user,
        message: `Connexion par reconnaissance faciale réussie (confiance: ${(faceAuth.confidence * 100).toFixed(1)}%)`
      };
    } catch (error) {
      console.error('Error in face login:', error);
      return {
        success: false,
        message: 'Erreur lors de la connexion par reconnaissance faciale'
      };
    }
  }

  async verifyToken(token: string): Promise<{ valid: boolean; userId?: number; user?: UserResponse }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: number };
      
      // Vérifier si l'utilisateur existe toujours et est actif
      const user = await this.userService.getUserById(decoded.userId);
      if (!user) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: decoded.userId,
        user
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      return { valid: false };
    }
  }

  async refreshToken(oldToken: string): Promise<AuthResponse> {
    try {
      const verification = await this.verifyToken(oldToken);
      
      if (!verification.valid || !verification.userId || !verification.user) {
        return {
          success: false,
          message: 'Token invalide'
        };
      }

      // Générer un nouveau token
      const newToken = this.generateToken(verification.userId);

      return {
        success: true,
        token: newToken,
        user: verification.user,
        message: 'Token rafraîchi avec succès'
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return {
        success: false,
        message: 'Erreur lors du rafraîchissement du token'
      };
    }
  }

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // En principe, nous pourrions maintenir une liste de tokens invalidés
      // Pour simplifier, nous considérons que le logout côté client suffit
      // Dans une implémentation plus robuste, vous pourriez stocker les tokens invalidés
      
      return {
        success: true,
        message: 'Déconnexion réussie'
      };
    } catch (error) {
      console.error('Error during logout:', error);
      return {
        success: false,
        message: 'Erreur lors de la déconnexion'
      };
    }
  }

  async getLoginHistory(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const history = await this.db.all(`
        SELECT login_method, ip_address, user_agent, login_time
        FROM login_sessions
        WHERE user_id = ?
        ORDER BY login_time DESC
        LIMIT ?
      `, [userId, limit]);

      return history || [];
    } catch (error) {
      console.error('Error getting login history:', error);
      throw error;
    }
  }

  private generateToken(userId: number): string {
    return jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  private async logLoginSession(
    userId: number, 
    loginMethod: 'password' | 'face', 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    try {
      await this.db.run(`
        INSERT INTO login_sessions (user_id, login_method, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
      `, [userId, loginMethod, ipAddress || null, userAgent || null]);
    } catch (error) {
      console.error('Error logging login session:', error);
      // Ne pas faire échouer l'authentification si l'enregistrement de session échoue
    }
  }

  // Middleware pour vérifier l'authentification
  async authenticateRequest(token: string): Promise<{ authenticated: boolean; user?: UserResponse; error?: string }> {
    try {
      if (!token) {
        return {
          authenticated: false,
          error: 'Token manquant'
        };
      }

      // Supprimer le préfixe "Bearer " si présent
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

      const verification = await this.verifyToken(cleanToken);
      
      if (!verification.valid || !verification.user) {
        return {
          authenticated: false,
          error: 'Token invalide ou expiré'
        };
      }

      return {
        authenticated: true,
        user: verification.user
      };
    } catch (error) {
      console.error('Error authenticating request:', error);
      return {
        authenticated: false,
        error: 'Erreur d\'authentification'
      };
    }
  }
}