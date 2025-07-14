import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Configuration de base
const API_BASE_URL = 'http://localhost:3001/api';

// Interface pour les réponses API
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: any;
  token?: string;
  error?: string;
}

// Interface pour les données utilisateur
interface User {
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
}

// Interface pour les données de connexion
interface LoginRequest {
  email?: string;
  username?: string;
  password?: string;
}

interface FaceLoginRequest {
  faceDescriptor: number[];
}

interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
}

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les réponses
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          this.clearToken();
          // Rediriger vers la page de connexion si nécessaire
        }
        return Promise.reject(error);
      }
    );

    // Charger le token depuis le localStorage au démarrage
    this.loadToken();
  }

  // Gestion du token
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private loadToken(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.token = token;
    }
  }

  // ===== AUTHENTIFICATION =====

  async login(credentials: LoginRequest): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/login', credentials);
      
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  }

  async loginWithFace(faceData: FaceLoginRequest): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/login/face', faceData);
      
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion faciale'
      };
    }
  }

  async register(userData: CreateUserRequest): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.post('/users/register', userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur d\'inscription'
      };
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/logout');
      this.clearToken();
      return response.data;
    } catch (error: any) {
      this.clearToken();
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de déconnexion'
      };
    }
  }

  async verifyToken(): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/verify');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Token invalide'
      };
    }
  }

  async getMe(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de récupération du profil'
      };
    }
  }

  // ===== GESTION DES UTILISATEURS =====

  async getUsers(page = 1, limit = 10): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.get(`/users?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de récupération des utilisateurs'
      };
    }
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.api.get(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de récupération de l\'utilisateur'
      };
    }
  }

  async updateUser(id: number, userData: Partial<CreateUserRequest>): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de mise à jour'
      };
    }
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.delete(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de suppression'
      };
    }
  }

  // ===== GESTION DES PHOTOS =====

  async uploadProfilePhoto(userId: number, file: File): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);

      const response: AxiosResponse<ApiResponse> = await this.api.post(`/users/${userId}/profile-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur d\'upload de photo'
      };
    }
  }

  // ===== RECONNAISSANCE FACIALE =====

  async registerFaceData(faceDescriptor: number[], file: File, isPrimary = false): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('facePhoto', file);
      formData.append('faceDescriptor', JSON.stringify(faceDescriptor));
      formData.append('isPrimary', isPrimary.toString());

      const response: AxiosResponse<ApiResponse> = await this.api.post('/face/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur d\'enregistrement facial'
      };
    }
  }

  async getFaceData(): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.get('/face/me');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de récupération des données faciales'
      };
    }
  }

  async deleteFaceData(faceDataId: number): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.delete(`/face/${faceDataId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de suppression des données faciales'
      };
    }
  }

  async setPrimaryFaceData(faceDataId: number): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.put(`/face/${faceDataId}/set-primary`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de définition de photo principale'
      };
    }
  }

  async testFaceRecognition(faceDescriptor: number[]): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.post('/face/test-recognition', {
        faceDescriptor
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de test de reconnaissance'
      };
    }
  }

  // ===== UTILITAIRES =====

  async checkHealth(): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.get('/health');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: 'Backend inaccessible'
      };
    }
  }

  // Convertir un blob/dataURL en File
  dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }
}

// Singleton instance
const apiService = new ApiService();
export default apiService;

// Export des types pour utilisation dans les composants
export type { User, CreateUserRequest, LoginRequest, FaceLoginRequest, ApiResponse };