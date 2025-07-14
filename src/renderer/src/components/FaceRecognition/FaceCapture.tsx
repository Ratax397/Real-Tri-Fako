import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

interface FaceCaptureProps {
  onFaceDetected?: (descriptor: Float32Array, imageData: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
  isCapturing?: boolean;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({
  onFaceDetected,
  onError,
  width = 640,
  height = 480,
  isCapturing = false
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // Charger les modèles face-api.js
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; // Les modèles doivent être dans le dossier public/models
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        
        setIsLoaded(true);
        console.log('Face-api models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        onError?.('Erreur lors du chargement des modèles de reconnaissance faciale');
      }
    };

    loadModels();
  }, [onError]);

  // Détecter et analyser le visage
  const detectFace = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current || !isLoaded || isDetecting) {
      return;
    }

    const video = webcamRef.current.video;
    if (!video) return;

    setIsDetecting(true);

    try {
      // Détecter le visage avec les landmarks et la reconnaissance
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setFaceDetected(true);
        
        // Dessiner la détection sur le canvas
        const canvas = canvasRef.current;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        
        // Nettoyer le canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Dessiner la boîte de détection
          faceapi.draw.drawDetections(canvas, [resizedDetection]);
          faceapi.draw.drawFaceLandmarks(canvas, [resizedDetection]);
        }

        // Si on capture, retourner les données
        if (isCapturing && onFaceDetected) {
          const imageData = webcamRef.current.getScreenshot();
          if (imageData) {
            onFaceDetected(detection.descriptor, imageData);
          }
        }
      } else {
        setFaceDetected(false);
        
        // Nettoyer le canvas si aucun visage détecté
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    } catch (error) {
      console.error('Error during face detection:', error);
      onError?.('Erreur lors de la détection faciale');
    } finally {
      setIsDetecting(false);
    }
  }, [isLoaded, isDetecting, isCapturing, onFaceDetected, onError]);

  // Boucle de détection
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(detectFace, 100); // Détecter toutes les 100ms

    return () => clearInterval(interval);
  }, [detectFace, isLoaded]);

  const videoConstraints = {
    width,
    height,
    facingMode: 'user'
  };

  return (
    <div className="relative">
      <div className="relative inline-block">
        <Webcam
          ref={webcamRef}
          audio={false}
          width={width}
          height={height}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="rounded-lg border-2 border-gray-300"
        />
        
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width, height }}
        />

        {/* Indicateur de statut */}
        <div className="absolute top-2 right-2 flex items-center space-x-2">
          {!isLoaded && (
            <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">
              Chargement...
            </div>
          )}
          
          {isLoaded && (
            <div className={`px-2 py-1 rounded text-xs ${
              faceDetected 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {faceDetected ? 'Visage détecté' : 'Aucun visage'}
            </div>
          )}

          {isCapturing && (
            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs animate-pulse">
              Capture...
            </div>
          )}
        </div>

        {/* Guide de positionnement */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-white border-dashed rounded-lg opacity-30"></div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600">
        <p className="text-center">
          Placez votre visage dans le cadre et regardez la caméra
        </p>
        {!isLoaded && (
          <p className="text-center text-yellow-600 mt-1">
            Chargement des modèles de reconnaissance faciale...
          </p>
        )}
      </div>
    </div>
  );
};

export default FaceCapture;