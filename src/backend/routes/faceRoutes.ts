import { Router, Request, Response } from 'express';
import { FaceService } from '../services/faceService';
import { authMiddleware } from '../middleware/auth';
import { uploadFacePhoto, uploadMultipleFacePhotos, handleMulterError } from '../middleware/upload';

const router = Router();
const faceService = new FaceService();

// Route pour ajouter des données de reconnaissance faciale
router.post('/register', authMiddleware, uploadFacePhoto, handleMulterError, async (req: Request, res: Response) => {
  try {
    const { faceDescriptor, isPrimary } = req.body;
    const userId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Photo requise pour l\'enregistrement facial'
      });
    }

    if (!faceDescriptor) {
      return res.status(400).json({
        success: false,
        message: 'Descripteur facial requis'
      });
    }

    let parsedDescriptor;
    try {
      parsedDescriptor = JSON.parse(faceDescriptor);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Format de descripteur facial invalide'
      });
    }

    if (!faceService.isValidFaceDescriptor(parsedDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Descripteur facial invalide'
      });
    }

    const photoPath = `faces/${req.file.filename}`;
    const faceDataId = await faceService.saveFaceData(
      userId,
      parsedDescriptor,
      photoPath,
      isPrimary === 'true'
    );

    res.status(201).json({
      success: true,
      faceDataId,
      photo_url: `/uploads/${photoPath}`,
      message: 'Données de reconnaissance faciale enregistrées avec succès'
    });
  } catch (error) {
    console.error('Error in face register route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement des données faciales'
    });
  }
});

// Route pour ajouter plusieurs photos de reconnaissance faciale
router.post('/register-multiple', authMiddleware, uploadMultipleFacePhotos, handleMulterError, async (req: Request, res: Response) => {
  try {
    const { faceDescriptors } = req.body;
    const userId = req.user!.id;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins une photo est requise'
      });
    }

    if (!faceDescriptors) {
      return res.status(400).json({
        success: false,
        message: 'Descripteurs faciaux requis'
      });
    }

    let parsedDescriptors;
    try {
      parsedDescriptors = JSON.parse(faceDescriptors);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Format de descripteurs faciaux invalide'
      });
    }

    if (!Array.isArray(parsedDescriptors) || parsedDescriptors.length !== req.files.length) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre de descripteurs doit correspondre au nombre de photos'
      });
    }

    const results = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const descriptor = parsedDescriptors[i];

      if (!faceService.isValidFaceDescriptor(descriptor)) {
        continue; // Ignorer les descripteurs invalides
      }

      const photoPath = `faces/${file.filename}`;
      const faceDataId = await faceService.saveFaceData(
        userId,
        descriptor,
        photoPath,
        i === 0 // La première photo est définie comme principale
      );

      results.push({
        faceDataId,
        photo_url: `/uploads/${photoPath}`,
        filename: file.filename
      });
    }

    res.status(201).json({
      success: true,
      results,
      message: `${results.length} photos de reconnaissance faciale enregistrées avec succès`
    });
  } catch (error) {
    console.error('Error in face register multiple route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement des données faciales'
    });
  }
});

// Route pour obtenir les données de reconnaissance faciale d'un utilisateur
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    // Vérifier que l'utilisateur peut accéder à ses propres données ou est admin
    if (req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const faceData = await faceService.getFaceDataByUserId(userId);

    // Ajouter les URLs complètes pour les photos
    const faceDataWithUrls = faceData.map(data => ({
      ...data,
      photo_url: `/uploads/${data.photo_path}`
    }));

    res.json({
      success: true,
      faceData: faceDataWithUrls,
      message: 'Données de reconnaissance faciale récupérées avec succès'
    });
  } catch (error) {
    console.error('Error in get face data route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données faciales'
    });
  }
});

// Route pour obtenir les données de reconnaissance faciale de l'utilisateur connecté
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const faceData = await faceService.getFaceDataByUserId(userId);

    // Ajouter les URLs complètes pour les photos
    const faceDataWithUrls = faceData.map(data => ({
      ...data,
      photo_url: `/uploads/${data.photo_path}`
    }));

    res.json({
      success: true,
      faceData: faceDataWithUrls,
      message: 'Vos données de reconnaissance faciale récupérées avec succès'
    });
  } catch (error) {
    console.error('Error in get my face data route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données faciales'
    });
  }
});

// Route pour définir une photo comme principale
router.put('/:faceDataId/set-primary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const faceDataId = parseInt(req.params.faceDataId);
    const userId = req.user!.id;

    if (isNaN(faceDataId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de données faciales invalide'
      });
    }

    const success = await faceService.setPrimaryFaceData(faceDataId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Données faciales non trouvées'
      });
    }

    res.json({
      success: true,
      message: 'Photo principale définie avec succès'
    });
  } catch (error) {
    console.error('Error in set primary face data route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la définition de la photo principale'
    });
  }
});

// Route pour supprimer des données de reconnaissance faciale
router.delete('/:faceDataId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const faceDataId = parseInt(req.params.faceDataId);

    if (isNaN(faceDataId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de données faciales invalide'
      });
    }

    // Récupérer les données faciales pour vérifier la propriété
    const allFaceData = await faceService.getAllFaceData();
    const targetFaceData = allFaceData.find(data => data.id === faceDataId);

    if (!targetFaceData) {
      return res.status(404).json({
        success: false,
        message: 'Données faciales non trouvées'
      });
    }

    // Vérifier que l'utilisateur peut supprimer ses propres données
    if (req.user!.id !== targetFaceData.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const success = await faceService.deleteFaceData(faceDataId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Erreur lors de la suppression'
      });
    }

    res.json({
      success: true,
      message: 'Données faciales supprimées avec succès'
    });
  } catch (error) {
    console.error('Error in delete face data route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des données faciales'
    });
  }
});

// Route pour tester la reconnaissance faciale
router.post('/test-recognition', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Descripteur facial invalide'
      });
    }

    if (!faceService.isValidFaceDescriptor(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Format de descripteur facial invalide'
      });
    }

    const result = await faceService.authenticateByFace(faceDescriptor);

    if (result) {
      res.json({
        success: true,
        recognized: true,
        userId: result.userId,
        confidence: result.confidence,
        message: `Visage reconnu avec ${(result.confidence * 100).toFixed(1)}% de confiance`
      });
    } else {
      res.json({
        success: true,
        recognized: false,
        message: 'Visage non reconnu'
      });
    }
  } catch (error) {
    console.error('Error in test recognition route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test de reconnaissance'
    });
  }
});

// Route pour obtenir les statistiques des données faciales (admin)
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await faceService.getFaceDataStats();

    res.json({
      success: true,
      stats,
      message: 'Statistiques récupérées avec succès'
    });
  } catch (error) {
    console.error('Error in get stats route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

export default router;