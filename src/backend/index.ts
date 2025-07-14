import startServer from './server';

// Démarrer le serveur backend
startServer().catch((error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});