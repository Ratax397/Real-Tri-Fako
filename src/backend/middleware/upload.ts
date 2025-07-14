import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Configuration du stockage pour les photos de profil
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads/profiles');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `profile_${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// Configuration du stockage pour les photos de reconnaissance faciale
const faceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads/faces');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `face_${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// Filtre pour les types de fichiers autorisés
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Types MIME autorisés pour les images
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, GIF ou WebP.'));
  }
};

// Limites de taille des fichiers
const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB maximum
  files: 1 // Un seul fichier à la fois
};

// Middleware pour l'upload de photo de profil
export const uploadProfilePhoto = multer({
  storage: profileStorage,
  fileFilter,
  limits
}).single('profilePhoto');

// Middleware pour l'upload de photo de reconnaissance faciale
export const uploadFacePhoto = multer({
  storage: faceStorage,
  fileFilter,
  limits
}).single('facePhoto');

// Middleware pour l'upload multiple de photos de reconnaissance faciale
export const uploadMultipleFacePhotos = multer({
  storage: faceStorage,
  fileFilter,
  limits: {
    ...limits,
    files: 5 // Maximum 5 photos à la fois
  }
}).array('facePhotos', 5);

// Fonction utilitaire pour supprimer un fichier
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // Le fichier n'existe pas, considérer comme succès
          resolve();
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });
};

// Fonction utilitaire pour obtenir l'URL relative d'un fichier
export const getFileUrl = (filename: string, type: 'profile' | 'face'): string => {
  return `/uploads/${type}s/${filename}`;
};

// Validation de la taille d'image (optionnel)
export const validateImageDimensions = async (filePath: string): Promise<{ width: number; height: number }> => {
  // Cette fonction nécessiterait une bibliothèque comme 'sharp' pour lire les dimensions
  // Pour l'instant, on retourne des dimensions par défaut
  return { width: 0, height: 0 };
};

// Middleware de gestion des erreurs de multer
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'Fichier trop volumineux. Taille maximale: 10 MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Trop de fichiers. Maximum autorisé dépassé'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Champ de fichier inattendu'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Erreur d\'upload: ' + error.message
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erreur d\'upload'
    });
  }
  
  next();
};