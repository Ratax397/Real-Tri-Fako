import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';
import { authMiddleware } from '../middleware/auth';
import { uploadProfilePhoto, handleMulterError } from '../middleware/upload';
import path from 'path';

const router = Router();
const userService = new UserService();

// Route pour créer un nouvel utilisateur (inscription)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, username, password, first_name, last_name, phone, address, date_of_birth } = req.body;

    // Validation des champs requis
    if (!email || !username || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, nom d\'utilisateur, mot de passe, prénom et nom sont requis'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Validation du mot de passe (au moins 6 caractères)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    const userData = {
      email,
      username,
      password,
      first_name,
      last_name,
      phone,
      address,
      date_of_birth
    };

    const newUser = await userService.createUser(userData);

    res.status(201).json({
      success: true,
      user: newUser,
      message: 'Utilisateur créé avec succès'
    });
  } catch (error: any) {
    console.error('Error in register route:', error);
    
    if (error.message.includes('existe déjà')) {
      res.status(409).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'utilisateur'
      });
    }
  }
});

// Route pour obtenir tous les utilisateurs (paginé)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await userService.getAllUsers(page, limit);

    res.json({
      success: true,
      users: result.users,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(result.total / limit),
        total_users: result.total,
        limit
      },
      message: 'Utilisateurs récupérés avec succès'
    });
  } catch (error) {
    console.error('Error in get users route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// Route pour obtenir un utilisateur par ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user,
      message: 'Utilisateur récupéré avec succès'
    });
  } catch (error) {
    console.error('Error in get user by ID route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});

// Route pour mettre à jour un utilisateur
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { email, username, first_name, last_name, phone, address, date_of_birth } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    // Vérifier que l'utilisateur peut modifier ses propres données ou est admin
    // Pour l'instant, on permet à un utilisateur de modifier ses propres données
    if (req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres informations'
      });
    }

    // Validation de l'email si fourni
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }
    }

    const updateData = {
      email,
      username,
      first_name,
      last_name,
      phone,
      address,
      date_of_birth
    };

    // Supprimer les champs undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const updatedUser = await userService.updateUser(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user: updatedUser,
      message: 'Utilisateur mis à jour avec succès'
    });
  } catch (error: any) {
    console.error('Error in update user route:', error);
    
    if (error.message.includes('email') || error.message.includes('nom d\'utilisateur')) {
      res.status(409).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'utilisateur'
      });
    }
  }
});

// Route pour supprimer un utilisateur (soft delete)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    // Vérifier que l'utilisateur peut supprimer son propre compte
    if (req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que votre propre compte'
      });
    }

    const deleted = await userService.deleteUser(userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Error in delete user route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
});

// Route pour upload de photo de profil
router.post('/:id/profile-photo', authMiddleware, uploadProfilePhoto, handleMulterError, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    // Vérifier que l'utilisateur peut modifier sa propre photo
    if (req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que votre propre photo de profil'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    // Construire le chemin relatif de la photo
    const photoPath = `profiles/${req.file.filename}`;

    // Mettre à jour la base de données
    const updated = await userService.updateProfilePhoto(userId, photoPath);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await userService.getUserById(userId);

    res.json({
      success: true,
      user: updatedUser,
      photo_url: `/uploads/${photoPath}`,
      message: 'Photo de profil mise à jour avec succès'
    });
  } catch (error) {
    console.error('Error in upload profile photo route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo de profil'
    });
  }
});

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.user!.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user,
      message: 'Profil récupéré avec succès'
    });
  } catch (error) {
    console.error('Error in get profile route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

export default router;