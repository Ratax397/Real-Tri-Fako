# Backend avec Reconnaissance Faciale

Ce projet implémente un backend complet avec authentification par reconnaissance faciale, base de données SQLite locale et API REST.

## 🚀 Fonctionnalités

### Authentification
- ✅ Connexion par email/mot de passe
- ✅ Connexion par reconnaissance faciale
- ✅ JWT tokens avec expiration
- ✅ Historique des connexions
- ✅ Middleware d'authentification

### Gestion des Utilisateurs (CRUD)
- ✅ Inscription avec validation
- ✅ Lecture des utilisateurs (paginée)
- ✅ Mise à jour des profils
- ✅ Suppression douce (soft delete)
- ✅ Upload de photos de profil

### Reconnaissance Faciale
- ✅ Enregistrement de données faciales
- ✅ Authentification par visage
- ✅ Upload multiple de photos
- ✅ Gestion des photos principales
- ✅ Test de reconnaissance

### Base de Données
- ✅ SQLite locale (aucune configuration externe)
- ✅ Tables automatiquement créées
- ✅ Relations entre utilisateurs et données faciales
- ✅ Triggers pour mise à jour automatique

## 🏗️ Architecture

```
src/backend/
├── database/
│   └── database.ts          # Configuration SQLite
├── middleware/
│   ├── auth.ts              # Authentification JWT
│   └── upload.ts            # Gestion des uploads
├── models/
│   └── User.ts              # Interfaces TypeScript
├── routes/
│   ├── authRoutes.ts        # Routes d'authentification
│   ├── userRoutes.ts        # Routes utilisateurs (CRUD)
│   └── faceRoutes.ts        # Routes reconnaissance faciale
├── services/
│   ├── authService.ts       # Logique d'authentification
│   ├── userService.ts       # Logique utilisateur
│   └── faceService.ts       # Logique reconnaissance faciale
├── index.ts                 # Point d'entrée
└── server.ts                # Configuration Express
```

## 📦 Installation et Démarrage

### 1. Installer les dépendances
```bash
npm install
```

### 2. Démarrer en développement
```bash
npm run dev
```
Cette commande démarre simultanément :
- Le backend Express sur le port 3001
- L'application Electron avec le frontend

### 3. Démarrer uniquement le backend
```bash
npm run backend:dev
```

## 🔧 Configuration

### Variables d'environnement (optionnel)
Créez un fichier `.env` à la racine :
```bash
JWT_SECRET=votre-clé-secrète-très-sécurisée
PORT=3001
```

### Base de données
La base de données SQLite est automatiquement créée dans :
```
src/database/users.db
```

### Uploads
Les fichiers uploadés sont stockés dans :
```
src/uploads/
├── profiles/     # Photos de profil
└── faces/        # Photos de reconnaissance faciale
```

## 📡 API Endpoints

### Authentification
```
POST /api/auth/login              # Connexion par mot de passe
POST /api/auth/login/face         # Connexion par reconnaissance faciale
POST /api/auth/verify             # Vérifier le token
POST /api/auth/refresh            # Rafraîchir le token
POST /api/auth/logout             # Déconnexion
GET  /api/auth/me                 # Informations utilisateur connecté
GET  /api/auth/login-history      # Historique des connexions
```

### Utilisateurs (CRUD)
```
POST /api/users/register          # Inscription
GET  /api/users                   # Liste des utilisateurs (paginée)
GET  /api/users/:id               # Utilisateur par ID
PUT  /api/users/:id               # Modifier un utilisateur
DELETE /api/users/:id             # Supprimer un utilisateur
POST /api/users/:id/profile-photo # Upload photo de profil
GET  /api/users/me/profile        # Profil de l'utilisateur connecté
```

### Reconnaissance Faciale
```
POST /api/face/register           # Enregistrer des données faciales
POST /api/face/register-multiple  # Enregistrer plusieurs photos
GET  /api/face/me                 # Mes données faciales
GET  /api/face/user/:userId       # Données faciales d'un utilisateur
PUT  /api/face/:id/set-primary    # Définir photo principale
DELETE /api/face/:id              # Supprimer données faciales
POST /api/face/test-recognition   # Tester reconnaissance
GET  /api/face/stats              # Statistiques
```

### Santé
```
GET  /api/health                  # État du serveur
```

## 🔐 Sécurité

### Authentification JWT
- Tokens avec expiration (24h par défaut)
- Middleware de protection des routes
- Vérification automatique des tokens

### Upload de fichiers
- Types de fichiers validés (images uniquement)
- Taille limitée (10MB max)
- Noms de fichiers uniques (UUID)

### Base de données
- Mots de passe hashés avec bcrypt
- Suppression douce des utilisateurs
- Validation des données

## 🧪 Tests

### Test de connexion
```bash
curl http://localhost:3001/api/health
```

### Test d'inscription
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "motdepasse123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Test de connexion
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "motdepasse123"
  }'
```

## 🎯 Frontend Integration

### Service API
Le frontend utilise le service API dans `src/renderer/src/services/api.ts` :

```typescript
import apiService from '../services/api';

// Connexion
const result = await apiService.login({
  email: 'user@example.com',
  password: 'password'
});

// Reconnaissance faciale
const faceResult = await apiService.loginWithFace({
  faceDescriptor: faceDescriptorArray
});
```

### Composant de capture
Le composant `FaceCapture` gère la reconnaissance faciale :

```typescript
import FaceCapture from '../components/FaceRecognition/FaceCapture';

<FaceCapture
  onFaceDetected={(descriptor, imageData) => {
    // Traiter les données faciales
  }}
  onError={(error) => {
    // Gérer les erreurs
  }}
  isCapturing={true}
/>
```

## 🔄 Temps Réel

### WebSockets (optionnel)
Pour ajouter des fonctionnalités temps réel, vous pouvez intégrer Socket.io :

```bash
npm install socket.io
npm install @types/socket.io
```

## 📊 Base de Données

### Tables
- **users** : Informations utilisateur
- **face_data** : Données de reconnaissance faciale
- **login_sessions** : Historique des connexions

### Schéma
```sql
-- Utilisateurs
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  profile_photo TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Données faciales
CREATE TABLE face_data (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  face_descriptor TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Sessions de connexion
CREATE TABLE login_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  login_method TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🚀 Production

### Build
```bash
npm run backend:build
npm run backend:start
```

### Variables d'environnement production
```bash
NODE_ENV=production
JWT_SECRET=votre-clé-secrète-très-sécurisée-en-production
PORT=3001
```

## 🛠️ Développement

### Ajout de nouvelles fonctionnalités
1. Créer le modèle dans `models/`
2. Ajouter la logique dans `services/`
3. Créer les routes dans `routes/`
4. Tester avec curl ou Postman

### Debug
Le serveur utilise `nodemon` pour le rechargement automatique en développement.

## 📝 Notes

- La base de données SQLite est parfaite pour le développement et les petites applications
- Les modèles face-api.js doivent être téléchargés séparément
- La reconnaissance faciale fonctionne mieux avec de bonnes conditions d'éclairage
- Les tokens JWT expirent après 24h par défaut

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request