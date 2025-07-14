import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/database';
import { User, CreateUserRequest, UpdateUserRequest, UserResponse } from '../models/User';

export class UserService {
  private get db() {
    return getDatabase();
  }

  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this.db.get(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [userData.email, userData.username]
      );

      if (existingUser) {
        throw new Error('Un utilisateur avec cet email ou nom d\'utilisateur existe déjà');
      }

      // Hasher le mot de passe
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Insérer le nouvel utilisateur
      const result = await this.db.run(`
        INSERT INTO users (
          email, username, password_hash, first_name, last_name, 
          phone, address, date_of_birth
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.email,
        userData.username,
        passwordHash,
        userData.first_name,
        userData.last_name,
        userData.phone || null,
        userData.address || null,
        userData.date_of_birth || null
      ]);

      if (!result.lastID) {
        throw new Error('Erreur lors de la création de l\'utilisateur');
      }

      // Récupérer l'utilisateur créé
      const newUser = await this.getUserById(result.lastID);
      if (!newUser) {
        throw new Error('Utilisateur créé mais impossible de le récupérer');
      }

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(id: number): Promise<UserResponse | null> {
    try {
      const user = await this.db.get(`
        SELECT id, email, username, first_name, last_name, phone, 
               address, date_of_birth, profile_photo, is_active, 
               created_at, updated_at
        FROM users WHERE id = ? AND is_active = 1
      `, [id]);

      return user || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.db.get(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email]
      );
      return user || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.db.get(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [username]
      );
      return user || null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{users: UserResponse[], total: number}> {
    try {
      const offset = (page - 1) * limit;
      
      const users = await this.db.all(`
        SELECT id, email, username, first_name, last_name, phone, 
               address, date_of_birth, profile_photo, is_active, 
               created_at, updated_at
        FROM users WHERE is_active = 1
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      const countResult = await this.db.get(
        'SELECT COUNT(*) as total FROM users WHERE is_active = 1'
      );

      return {
        users: users || [],
        total: countResult?.total || 0
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: UpdateUserRequest): Promise<UserResponse | null> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier l'unicité de l'email et du nom d'utilisateur si modifiés
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await this.db.get(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [userData.email, id]
        );
        if (emailExists) {
          throw new Error('Cet email est déjà utilisé par un autre utilisateur');
        }
      }

      if (userData.username && userData.username !== existingUser.username) {
        const usernameExists = await this.db.get(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [userData.username, id]
        );
        if (usernameExists) {
          throw new Error('Ce nom d\'utilisateur est déjà utilisé');
        }
      }

      // Construire la requête de mise à jour dynamiquement
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      });

      if (updateFields.length === 0) {
        return existingUser;
      }

      updateValues.push(id);

      await this.db.run(`
        UPDATE users SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues);

      return await this.getUserById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await this.db.run(
        'UPDATE users SET is_active = 0 WHERE id = ?',
        [id]
      );

      return result.changes! > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  async updateProfilePhoto(userId: number, photoPath: string): Promise<boolean> {
    try {
      const result = await this.db.run(
        'UPDATE users SET profile_photo = ? WHERE id = ?',
        [photoPath, userId]
      );

      return result.changes! > 0;
    } catch (error) {
      console.error('Error updating profile photo:', error);
      throw error;
    }
  }
}