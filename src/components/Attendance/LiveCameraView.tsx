'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, Eye, ShieldCheck, Video, Zap, AlertCircle, VideoOff } from 'lucide-react';
import { generateEmbeddingFromCanvas, checkLiveness } from '@/utils/faceRecognition';

interface LiveCameraViewProps {
  onFrameCaptured?: (embedding: number[], isLive: boolean) => void;
  isVerifying?: boolean;
  isActive?: boolean;
}

export const LiveCameraView: React.FC<LiveCameraViewProps> = ({
  onFrameCaptured,
  isVerifying,
  isActive = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'webcam' | 'esp32'>('webcam');
  const [livenessStatus, setLivenessStatus] = useState<{ isLive: boolean; message: string }>({
    isLive: true,
    message: 'Liveness Verified (Blink Active)',
  });

  // Stop Webcam Hardware Stream Completely (Turns off Camera LED)
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setCameraActive(false);
  };

  // Initialize WebCam Stream
  const startWebcam = async () => {
    // Make sure any existing stream is closed first
    stopWebcam();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (e) {
      console.warn('Webcam permission denied or not available, fallback to camera simulator:', e);
      setCameraActive(false);
    }
  };

  // Lifecycle control: Start when active, Stop when inactive or unmounted
  useEffect(() => {
    if (isActive) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isActive]);

  // Periodic Frame Scan & Liveness Check
  useEffect(() => {
    if (!cameraActive || !isActive) return;

    const interval = setInterval(() => {
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Perform Liveness Detection
          const liveCheck = checkLiveness(canvas);
          setLivenessStatus({ isLive: liveCheck.isLive, message: liveCheck.message });

          // Extract embedding vector
          const embedding = generateEmbeddingFromCanvas(canvas);
          if (onFrameCaptured) {
            onFrameCaptured(embedding, liveCheck.isLive);
          }
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [cameraActive, isActive, onFrameCaptured]);

  return (
    <div className="relative rounded-2xl glass-panel overflow-hidden border border-indigo-500/30 bg-slate-950 p-2 shadow-xl">
      
      {/* Top HUD Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 rounded-xl mb-2 text-[11px] border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cameraActive ? 'bg-emerald-400 opacity-75' : 'bg-rose-400 opacity-0'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${cameraActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className={`font-mono font-bold uppercase ${cameraActive ? 'text-emerald-400' : 'text-slate-400'}`}>
            {cameraActive ? 'LIVE CAMERA STREAM' : 'CAMERA OFF (HARDWARE SHUTDOWN)'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Eye className={`w-3.5 h-3.5 ${cameraActive ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />
          <span className="font-mono text-slate-300 font-semibold">
            {cameraActive ? livenessStatus.message : 'Camera Offline'}
          </span>
        </div>
      </div>

      {/* Video Viewport Container */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
        
        {/* Real WebCam Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraActive && stream ? 'block' : 'hidden'}`}
        />

        {/* Camera Off / Hardware Closed State */}
        {(!cameraActive || !stream) && (
          <div className="relative w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <VideoOff className="w-7 h-7" />
            </div>
            <p className="text-xs font-bold text-slate-200">Webcam Feed Closed</p>
            <p className="text-[10px] text-slate-400 max-w-xs">
              Hardware camera stream and LED indicator turn off automatically when attendance is stopped or completed.
            </p>
          </div>
        )}

        {/* Hidden Canvas for Feature Extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Futuristic Facial Reticle & Target Bounding Box Overlay */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`relative w-44 h-56 rounded-3xl border-2 transition-all duration-300 ${
              isVerifying
                ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                : 'border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
            }`}>
              {/* Corner Crosshairs */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />

              {/* Scanning Laser HUD Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-bounce mt-10" />

              {/* HUD Status Label */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-950/80 border border-indigo-500/30 text-[9px] font-mono font-bold text-indigo-300 uppercase whitespace-nowrap">
                {isVerifying ? 'Verifying Face Biomterics...' : 'Face Aligned'}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Security & Mode Switcher */}
      <div className="mt-2 flex items-center justify-between px-2 text-[10px] text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Anti-Proxy 1:N Face Lock ACTIVE (Req ≥ 85%)</span>
        </div>

        <button
          onClick={() => {
            if (cameraActive) stopWebcam();
            else startWebcam();
          }}
          className="hover:text-white font-semibold flex items-center space-x-1"
        >
          <RefreshCw className="w-3 h-3 text-indigo-400" />
          <span>{cameraActive ? 'Turn Off Stream' : 'Enable Stream'}</span>
        </button>
      </div>

    </div>
  );
};
