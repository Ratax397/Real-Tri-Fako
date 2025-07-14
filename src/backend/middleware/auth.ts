import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

// Extension de l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        username: string;
        first_name: string;
        last_name: string;
        phone?: string;
        address?: string;
        date_of_birth?: string;
        profile_photo?: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    const authService = new AuthService();
    const authentication = await authService.authenticateRequest(authHeader);

    if (!authentication.authenticated) {
      return res.status(401).json({
        success: false,
        message: authentication.error || 'Token invalide'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = authentication.user;
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

// Middleware optionnel pour récupérer l'utilisateur s'il est connecté (sans erreur si pas connecté)
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const authService = new AuthService();
      const authentication = await authService.authenticateRequest(authHeader);

      if (authentication.authenticated) {
        req.user = authentication.user;
      }
    }

    next();
  } catch (error) {
    console.error('Error in optional auth middleware:', error);
    // Continue sans erreur même si l'authentification échoue
    next();
  }
};