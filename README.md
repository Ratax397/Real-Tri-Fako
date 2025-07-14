# Documentation d'utilisation

## Backend (FastAPI + SQLite + Reconnaissance Faciale)

### Prérequis
- Python 3.10 installé
- (Windows) Visual Studio Build Tools recommandé pour `face_recognition`

### Installation et lancement
1. Ouvre un terminal dans le dossier `backend`
2. Crée un environnement virtuel et active-le :
   ```sh
   python -m venv venv
   venv\Scripts\activate
   ```
3. Installe les dépendances :
   ```sh
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Lance le serveur :
   ```sh
   uvicorn main:app --reload
   ```
5. Le backend écoute sur `http://localhost:8000`

### Endpoints principaux
- `POST /users/` : Ajouter un utilisateur (form-data : nom, etablissement, photo)
- `GET /users/` : Lister les utilisateurs
- `DELETE /users/{id}` : Supprimer un utilisateur
- `POST /auth/face` : Authentification par reconnaissance faciale (form-data : photo)
- Les photos sont servies sur `/photos/{nom_fichier}`

---

## Frontend (React)

### Prérequis
- Node.js et npm installés

### Installation et lancement
1. Ouvre un terminal dans le dossier `src/renderer`
2. Installe les dépendances :
   ```sh
   npm install
   ```
3. Lance le serveur de développement :
   ```sh
   npm run dev
   ```
4. Le frontend écoute sur le port affiché (souvent `http://localhost:5173`)

### Fonctionnalités principales
- **Gestion des utilisateurs** :
  - Accès via `/home/utilisateur`
  - Liste, ajout (avec photo), suppression d'utilisateurs
  - Les données sont synchronisées avec le backend
- **Connexion par reconnaissance faciale** :
  - Accès via `/auth-face` ou bouton sur la page d'accueil
  - Upload d'une photo pour authentification
  - Affichage du résultat (utilisateur reconnu ou non)

### Conseils
- Le backend doit être lancé avant le frontend pour que les appels API fonctionnent.
- Les photos uploadées sont stockées dans `backend/photos/` et accessibles via l'URL du backend.
- Pour tester la reconnaissance faciale, ajoute un utilisateur avec une photo claire, puis essaye de te connecter avec une photo similaire.

---

## Architecture du projet

```
/backend
  ├── main.py, models.py, ...
  ├── photos/                # Dossier pour les photos utilisateurs
/src/renderer
  └── src/
      ├── pages/
      │   ├── home/
      │   ├── utilisateurs/
      │   └── auth-face/
      └── components/
```

---

## Problèmes fréquents
- **Erreur d'installation de `face_recognition`** :
  - Installer `cmake` (`pip install cmake`)
  - Installer Visual Studio Build Tools (Windows)
- **API inaccessible** :
  - Vérifier que le backend tourne bien sur `localhost:8000`
- **Photos non affichées** :
  - Vérifier que le chemin de la photo commence par `/photos/` côté frontend

---

Pour toute question ou amélioration, contacte le développeur du projet !
