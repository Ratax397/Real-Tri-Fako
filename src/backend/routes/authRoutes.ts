import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const authService = new AuthService();

// Route de connexion avec mot de passe
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis'
      });
    }

    if (!email && !username) {
      return res.status(400).json({
        success: false,
        message: 'Email ou nom d\'utilisateur requis'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.loginWithPassword(
      { email, username, password },
      ipAddress,
      userAgent
    );

    const statusCode = result.success ? 200 : 401;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Error in login route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route de connexion par reconnaissance faciale
router.post('/login/face', async (req: Request, res: Response) => {
  try {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Descripteur facial invalide'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.loginWithFace(
      { faceDescriptor },
      ipAddress,
      userAgent
    );

    const statusCode = result.success ? 200 : 401;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Error in face login route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route de vérification du token
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(400).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const verification = await authService.verifyToken(token);

    if (verification.valid) {
      res.json({
        success: true,
        user: verification.user,
        message: 'Token valide'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
  } catch (error) {
    console.error('Error in verify route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route de rafraîchissement du token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(400).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const result = await authService.refreshToken(token);

    const statusCode = result.success ? 200 : 401;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Error in refresh route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route de déconnexion
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader!.startsWith('Bearer ') ? authHeader!.slice(7) : authHeader!;
    
    const result = await authService.logout(token);
    res.json(result);
  } catch (error) {
    console.error('Error in logout route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir l'historique des connexions
router.get('/login-history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.user!.id;

    const history = await authService.getLoginHistory(userId, limit);

    res.json({
      success: true,
      history,
      message: 'Historique récupéré avec succès'
    });
  } catch (error) {
    console.error('Error in login history route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      user: req.user,
      message: 'Informations utilisateur récupérées'
    });
  } catch (error) {
    console.error('Error in me route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;