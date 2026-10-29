'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, Sparkles, User, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartfaceApi } from '@/adapters/smartfaceApi';

interface FaceEnrollmentStudioProps {
  studentId: string;
  studentName: string;
  onCompleted?: () => void;
  onCancel?: () => void;
}

const SAMPLE_STEPS = [
  { id: 1, label: 'Sample 1: Straight Ahead (Neutral)', instruction: 'Look directly into the camera with a neutral expression' },
  { id: 2, label: 'Sample 2: Slight Angle Left', instruction: 'Tilt head slightly to the left' },
  { id: 3, label: 'Sample 3: Slight Angle Right', instruction: 'Tilt head slightly to the right' },
  { id: 4, label: 'Sample 4: Natural Expression', instruction: 'Natural smile or relaxed face' },
];

export const FaceEnrollmentStudio: React.FC<FaceEnrollmentStudioProps> = ({
  studentId,
  studentName,
  onCompleted,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [capturedSamples, setCapturedSamples] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (e: any) {
      setErrorMessage(e.message || 'Camera access error');
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Capture frame
  const captureCurrentSample = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg', 0.85);

    const updated = [...capturedSamples, dataUri];
    setCapturedSamples(updated);

    if (currentStep < SAMPLE_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // All 4 samples collected -> Submit to backend
      submitEnrollment(updated);
    }
  };

  const submitEnrollment = async (samples: string[]) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await smartfaceApi.enrollFace(studentId, samples);
      if (res.success) {
        setIsCompleted(true);
        stopCamera();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Face enrollment submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCapturedSamples([]);
    setCurrentStep(0);
    setIsCompleted(false);
    setErrorMessage(null);
    startCamera();
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl glass-panel border border-indigo-500/30 shadow-2xl p-6 space-y-6 bg-slate-950/90 text-white relative">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
              Face Biometric Enrollment Studio
            </h3>
            <p className="text-xs text-slate-400">
              Enrolling Student: <strong className="text-indigo-300">{studentName}</strong> ({studentId})
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Completion View */}
      {isCompleted ? (
        <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <div>
            <h4 className="text-xl font-extrabold text-emerald-300">
              Face Registration Completed Successfully.
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
              Your biometric embedding vector (128D) has been generated and securely associated with your college identity. You can now mark attendance using face recognition.
            </p>
          </div>

          <button
            onClick={() => {
              if (onCompleted) onCompleted();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Progress Indicator */}
          <div className="grid grid-cols-4 gap-2">
            {SAMPLE_STEPS.map((s, idx) => {
              const isDone = capturedSamples.length > idx;
              const isCurrent = currentStep === idx;
              return (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isDone
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <p className="text-[10px] font-mono font-bold">SAMPLE {idx + 1}</p>
                  <p className="text-[11px] font-extrabold truncate">
                    {isDone ? 'Captured ✓' : isCurrent ? 'Ready' : 'Pending'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Video Frame */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Oval Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-64 rounded-[50%] border-4 border-dashed border-indigo-400/70 shadow-2xl relative" />
            </div>

            {/* Current Step Instruction Banner */}
            <div className="absolute bottom-3 inset-x-4 p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-center">
              <p className="text-xs font-bold text-white">
                {SAMPLE_STEPS[currentStep]?.label}
              </p>
              <p className="text-[11px] text-indigo-300">
                {SAMPLE_STEPS[currentStep]?.instruction}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all"
            >
              Start Over
            </button>

            <button
              onClick={captureCurrentSample}
              disabled={isSubmitting || !cameraActive}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Generating AI Embeddings...'
                  : `Capture Sample ${currentStep + 1} of 4`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
