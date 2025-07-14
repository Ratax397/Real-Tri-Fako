import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FaceCapture from '../components/FaceRecognition/FaceCapture';
import apiService from '../services/api';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'password' | 'face'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // État pour la connexion par mot de passe
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  // État pour la reconnaissance faciale
  const [faceCapturing, setFaceCapturing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.login({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        setSuccess('Connexion réussie !');
        // Rediriger vers le dashboard après un court délai
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError(result.message || 'Erreur de connexion');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceDetected = async (descriptor: Float32Array, imageData: string) => {
    if (!faceCapturing) return;

    setLoading(true);
    setError(null);

    try {
      // Convertir Float32Array en number[]
      const descriptorArray = Array.from(descriptor);

      const result = await apiService.loginWithFace({
        faceDescriptor: descriptorArray
      });

      if (result.success) {
        setSuccess(result.message || 'Connexion par reconnaissance faciale réussie !');
        setFaceCapturing(false);
        // Rediriger vers le dashboard après un court délai
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError(result.message || 'Visage non reconnu');
      }
    } catch (error) {
      setError('Erreur lors de la reconnaissance faciale');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceError = (error: string) => {
    setError(error);
    setFaceCapturing(false);
  };

  const startFaceCapture = () => {
    setError(null);
    setFaceCapturing(true);
  };

  const stopFaceCapture = () => {
    setFaceCapturing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connectez-vous à votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choisissez votre méthode de connexion préférée
          </p>
        </div>

        {/* Onglets */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mot de passe
          </button>
          <button
            onClick={() => setActiveTab('face')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'face'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reconnaissance faciale
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contenu des onglets */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          )}

          {activeTab === 'face' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Reconnaissance faciale
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Placez votre visage devant la caméra pour vous connecter
                </p>
              </div>

              <div className="flex justify-center">
                <FaceCapture
                  onFaceDetected={handleFaceDetected}
                  onError={handleFaceError}
                  width={320}
                  height={240}
                  isCapturing={faceCapturing}
                />
              </div>

              <div className="flex space-x-4">
                {!faceCapturing ? (
                  <button
                    onClick={startFaceCapture}
                    disabled={loading}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? 'Analyse...' : 'Démarrer la reconnaissance'}
                  </button>
                ) : (
                  <button
                    onClick={stopFaceCapture}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Arrêter
                  </button>
                )}
              </div>

              {faceCapturing && (
                <div className="text-center">
                  <p className="text-sm text-blue-600">
                    Regardez la caméra et restez immobile...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Liens supplémentaires */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              S'inscrire
            </button>
          </p>
          <p className="text-sm text-gray-600">
            <button className="font-medium text-indigo-600 hover:text-indigo-500">
              Mot de passe oublié ?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;