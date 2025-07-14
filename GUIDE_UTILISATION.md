# Guide d'Utilisation - Backend avec Reconnaissance Faciale

## 🎯 Résumé

Vous avez maintenant un backend complet avec :
- ✅ **Authentication par mot de passe** avec JWT
- ✅ **Reconnaissance faciale** pour connexion sans mot de passe
- ✅ **Base de données SQLite locale** (aucune configuration externe)
- ✅ **API REST complète** avec CRUD des utilisateurs
- ✅ **Upload de fichiers** (photos de profil et reconnaissance faciale)
- ✅ **Frontend React** avec composants prêts à l'emploi

## 🚀 Démarrage Rapide

### 1. Démarrer le projet complet
```bash
npm run dev
```
Cette commande démarre simultanément :
- Backend Express sur le port **3001**
- Application Electron avec frontend React

### 2. Démarrer uniquement le backend
```bash
npm run backend:dev
```

### 3. Tester le backend
```bash
# Test de santé
curl http://localhost:3001/api/health

# Inscription d'un utilisateur
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser", 
    "password": "motdepasse123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "motdepasse123"
  }'
```

## 📡 API Endpoints Principaux

### Authentication
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion par mot de passe |
| POST | `/api/auth/login/face` | Connexion par reconnaissance faciale |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Informations utilisateur connecté |

### Utilisateurs (CRUD)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/users/register` | Inscription |
| GET | `/api/users` | Liste des utilisateurs |
| GET | `/api/users/:id` | Utilisateur par ID |
| PUT | `/api/users/:id` | Modifier un utilisateur |
| DELETE | `/api/users/:id` | Supprimer un utilisateur |
| POST | `/api/users/:id/profile-photo` | Upload photo de profil |

### Reconnaissance Faciale
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/face/register` | Enregistrer données faciales |
| GET | `/api/face/me` | Mes données faciales |
| POST | `/api/face/test-recognition` | Tester reconnaissance |
| DELETE | `/api/face/:id` | Supprimer données faciales |

## 🗂️ Structure des Fichiers

```
src/
├── backend/                  # Backend Express
│   ├── database/
│   │   └── database.ts       # Configuration SQLite
│   ├── middleware/
│   │   ├── auth.ts          # Authentification JWT
│   │   └── upload.ts        # Gestion uploads
│   ├── models/
│   │   └── User.ts          # Interfaces TypeScript
│   ├── routes/
│   │   ├── authRoutes.ts    # Routes auth
│   │   ├── userRoutes.ts    # Routes CRUD utilisateurs
│   │   └── faceRoutes.ts    # Routes reconnaissance faciale
│   ├── services/
│   │   ├── authService.ts   # Logique authentification
│   │   ├── userService.ts   # Logique utilisateur
│   │   └── faceService.ts   # Logique reconnaissance faciale
│   ├── index.ts             # Point d'entrée
│   └── server.ts            # Configuration Express
├── renderer/src/             # Frontend React
│   ├── components/
│   │   └── FaceRecognition/
│   │       └── FaceCapture.tsx  # Composant capture faciale
│   ├── pages/
│   │   └── Login.tsx        # Page de connexion
│   └── services/
│       └── api.ts           # Service API frontend
└── database/                # Base de données locale
    └── users.db            # SQLite (créé automatiquement)
```

## 🔧 Fonctionnalités Détaillées

### 1. Base de Données
- **SQLite locale** - Aucune configuration externe requise
- **Tables auto-créées** au premier démarrage
- **Relations** entre utilisateurs et données faciales
- **Soft delete** pour les utilisateurs

### 2. Authentification
- **JWT tokens** avec expiration (24h)
- **Mots de passe hashés** avec bcrypt
- **Double méthode** : mot de passe + reconnaissance faciale
- **Historique** des connexions

### 3. Reconnaissance Faciale
- **face-api.js** pour la détection
- **Descripteurs** stockés en base
- **Calcul de similarité** personnalisable
- **Photos multiples** par utilisateur
- **Photo principale** configurable

### 4. Upload de Fichiers
- **Types validés** (images uniquement)
- **Taille limitée** (10MB max)
- **Noms uniques** avec UUID
- **Dossiers organisés** (profiles/, faces/)

## 🎨 Frontend React

### Composant FaceCapture
```typescript
import FaceCapture from '../components/FaceRecognition/FaceCapture';

<FaceCapture
  onFaceDetected={(descriptor, imageData) => {
    // Traiter les données faciales
    console.log('Face detected:', descriptor);
  }}
  onError={(error) => {
    console.error('Face detection error:', error);
  }}
  isCapturing={true}
  width={640}
  height={480}
/>
```

### Service API
```typescript
import apiService from '../services/api';

// Connexion normale
const loginResult = await apiService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Connexion faciale
const faceLoginResult = await apiService.loginWithFace({
  faceDescriptor: Array.from(faceDescriptor)
});

// Enregistrement facial
const registerResult = await apiService.registerFaceData(
  Array.from(descriptor),
  imageFile,
  true // isPrimary
);
```

## 🔐 Sécurité

### Headers d'authentification
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Validation des données
- Email format validé
- Mot de passe minimum 6 caractères
- Types de fichiers vérifiés
- Taille des uploads limitée

## 📊 Base de Données

### Table `users`
```sql
id, email, username, password_hash, first_name, last_name,
phone, address, date_of_birth, profile_photo, is_active,
created_at, updated_at
```

### Table `face_data`
```sql
id, user_id, face_descriptor, photo_path, is_primary, created_at
```

### Table `login_sessions`
```sql
id, user_id, login_method, ip_address, user_agent, login_time
```

## 🐛 Débogage

### Logs du backend
```bash
# Démarrer avec logs détaillés
DEBUG=* npm run backend:dev
```

### Vérifier la base de données
```bash
# Installer sqlite3 CLI si nécessaire
sudo apt-get install sqlite3

# Explorer la base
sqlite3 src/database/users.db
.tables
SELECT * FROM users;
.exit
```

### Problèmes fréquents

1. **Port 3001 occupé**
   ```bash
   # Trouver et tuer le processus
   lsof -i :3001
   kill -9 <PID>
   ```

2. **Erreur de permissions SQLite**
   ```bash
   # Vérifier les permissions du dossier
   ls -la src/database/
   chmod 755 src/database/
   ```

3. **Face-api.js ne charge pas**
   - Vérifier que les modèles sont dans `public/models/`
   - Télécharger depuis : https://github.com/justadudewhohacks/face-api.js/tree/master/weights

## 🔄 Développement

### Ajouter de nouvelles routes
1. Créer la route dans `src/backend/routes/`
2. Ajouter la logique dans `src/backend/services/`
3. Mettre à jour le `server.ts`

### Modifier la base de données
1. Modifier `src/backend/database/database.ts`
2. Supprimer `src/database/users.db`
3. Redémarrer le backend

### Tests
```bash
# Test avec curl
curl -X GET http://localhost:3001/api/health

# Test avec Postman
# Importer la collection API depuis le README
```

## 🚀 Production

### Build
```bash
npm run backend:build
npm run build
```

### Variables d'environnement
```bash
NODE_ENV=production
JWT_SECRET=votre-clé-secrète-très-sécurisée
PORT=3001
```

### Déploiement
```bash
# Démarrer en production
npm run backend:start
```

## 📝 Notes Importantes

- ⚠️ **Changez le JWT_SECRET** en production
- 📷 **Modèles face-api.js** requis pour la reconnaissance faciale
- 🔒 **HTTPS recommandé** pour la caméra en production
- 💾 **Sauvegardes SQLite** recommandées pour les données importantes
- 🎯 **Reconnaissance faciale** : éclairage important pour la précision

## 🆘 Support

Pour des questions ou problèmes :
1. Vérifier les logs du backend
2. Tester les endpoints avec curl
3. Consulter le fichier `BACKEND_README.md` pour plus de détails
4. Vérifier la documentation face-api.js

---

**Félicitations ! Vous avez un backend complet avec reconnaissance faciale fonctionnel ! 🎉**