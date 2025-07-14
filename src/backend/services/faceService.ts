import { getDatabase } from '../database/database';
import { FaceData } from '../models/User';
import path from 'path';
import fs from 'fs';

export class FaceService {
  private get db() {
    return getDatabase();
  }
  
  // Seuil de similarité pour la reconnaissance faciale (ajustable)
  private readonly SIMILARITY_THRESHOLD = 0.6;

  async saveFaceData(userId: number, faceDescriptor: number[], photoPath: string, isPrimary: boolean = false): Promise<number> {
    try {
      // Si c'est une photo principale, désactiver les autres photos principales
      if (isPrimary) {
        await this.db.run(
          'UPDATE face_data SET is_primary = 0 WHERE user_id = ?',
          [userId]
        );
      }

      const result = await this.db.run(`
        INSERT INTO face_data (user_id, face_descriptor, photo_path, is_primary)
        VALUES (?, ?, ?, ?)
      `, [
        userId,
        JSON.stringify(faceDescriptor),
        photoPath,
        isPrimary ? 1 : 0
      ]);

      if (!result.lastID) {
        throw new Error('Erreur lors de la sauvegarde des données faciales');
      }

      return result.lastID;
    } catch (error) {
      console.error('Error saving face data:', error);
      throw error;
    }
  }

  async getFaceDataByUserId(userId: number): Promise<FaceData[]> {
    try {
      const faceData = await this.db.all(
        'SELECT * FROM face_data WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC',
        [userId]
      );

      return faceData || [];
    } catch (error) {
      console.error('Error getting face data by user ID:', error);
      throw error;
    }
  }

  async getAllFaceData(): Promise<FaceData[]> {
    try {
      const faceData = await this.db.all(
        'SELECT * FROM face_data ORDER BY user_id, is_primary DESC'
      );

      return faceData || [];
    } catch (error) {
      console.error('Error getting all face data:', error);
      throw error;
    }
  }

  async authenticateByFace(faceDescriptor: number[]): Promise<{ userId: number; confidence: number } | null> {
    try {
      // Récupérer toutes les données faciales
      const allFaceData = await this.getAllFaceData();

      let bestMatch: { userId: number; confidence: number } | null = null;
      let highestSimilarity = 0;

      for (const faceData of allFaceData) {
        try {
          const storedDescriptor = JSON.parse(faceData.face_descriptor);
          const similarity = this.calculateSimilarity(faceDescriptor, storedDescriptor);

          if (similarity > highestSimilarity && similarity > this.SIMILARITY_THRESHOLD) {
            highestSimilarity = similarity;
            bestMatch = {
              userId: faceData.user_id,
              confidence: similarity
            };
          }
        } catch (error) {
          console.error('Error parsing face descriptor:', error);
          continue;
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('Error authenticating by face:', error);
      throw error;
    }
  }

  async deleteFaceData(faceDataId: number): Promise<boolean> {
    try {
      // Récupérer les informations du fichier avant suppression
      const faceData = await this.db.get(
        'SELECT photo_path FROM face_data WHERE id = ?',
        [faceDataId]
      );

      if (faceData) {
        // Supprimer le fichier photo
        const fullPath = path.join(__dirname, '../../uploads', faceData.photo_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // Supprimer l'enregistrement de la base de données
      const result = await this.db.run(
        'DELETE FROM face_data WHERE id = ?',
        [faceDataId]
      );

      return result.changes! > 0;
    } catch (error) {
      console.error('Error deleting face data:', error);
      throw error;
    }
  }

  async deleteFaceDataByUserId(userId: number): Promise<boolean> {
    try {
      // Récupérer tous les chemins de photos avant suppression
      const faceDataList = await this.getFaceDataByUserId(userId);

      // Supprimer tous les fichiers photos
      for (const faceData of faceDataList) {
        const fullPath = path.join(__dirname, '../../uploads', faceData.photo_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // Supprimer tous les enregistrements de la base de données
      const result = await this.db.run(
        'DELETE FROM face_data WHERE user_id = ?',
        [userId]
      );

      return result.changes! > 0;
    } catch (error) {
      console.error('Error deleting face data by user ID:', error);
      throw error;
    }
  }

  async setPrimaryFaceData(faceDataId: number, userId: number): Promise<boolean> {
    try {
      // Désactiver toutes les photos principales de l'utilisateur
      await this.db.run(
        'UPDATE face_data SET is_primary = 0 WHERE user_id = ?',
        [userId]
      );

      // Activer la photo sélectionnée comme principale
      const result = await this.db.run(
        'UPDATE face_data SET is_primary = 1 WHERE id = ? AND user_id = ?',
        [faceDataId, userId]
      );

      return result.changes! > 0;
    } catch (error) {
      console.error('Error setting primary face data:', error);
      throw error;
    }
  }

  // Calcul de similarité entre deux descripteurs faciaux (distance euclidienne normalisée)
  private calculateSimilarity(descriptor1: number[], descriptor2: number[]): number {
    if (descriptor1.length !== descriptor2.length) {
      return 0;
    }

    let sumSquaredDifferences = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      const diff = descriptor1[i] - descriptor2[i];
      sumSquaredDifferences += diff * diff;
    }

    const euclideanDistance = Math.sqrt(sumSquaredDifferences);
    
    // Convertir la distance en score de similarité (0-1, où 1 = identique)
    // Cette formule peut être ajustée selon les besoins
    const maxDistance = Math.sqrt(descriptor1.length); // Distance maximale théorique
    const similarity = Math.max(0, 1 - (euclideanDistance / maxDistance));

    return similarity;
  }

  // Validation du descripteur facial
  isValidFaceDescriptor(descriptor: any): descriptor is number[] {
    return Array.isArray(descriptor) && 
           descriptor.length > 0 && 
           descriptor.every(value => typeof value === 'number' && !isNaN(value));
  }

  // Obtenir les statistiques des données faciales
  async getFaceDataStats(): Promise<{
    totalFaceData: number;
    totalUsers: number;
    usersWithFaceData: number;
  }> {
    try {
      const totalFaceDataResult = await this.db.get(
        'SELECT COUNT(*) as count FROM face_data'
      );

      const totalUsersResult = await this.db.get(
        'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
      );

      const usersWithFaceDataResult = await this.db.get(
        'SELECT COUNT(DISTINCT user_id) as count FROM face_data'
      );

      return {
        totalFaceData: totalFaceDataResult?.count || 0,
        totalUsers: totalUsersResult?.count || 0,
        usersWithFaceData: usersWithFaceDataResult?.count || 0
      };
    } catch (error) {
      console.error('Error getting face data stats:', error);
      throw error;
    }
  }
}