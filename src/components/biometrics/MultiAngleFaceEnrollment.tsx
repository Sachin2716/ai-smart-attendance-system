'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  User,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  DEFAULT_POSE_CONFIG,
  POSE_STEPS,
  PoseStepId,
  PoseStepMetadata,
} from '@/lib/biometrics/pose-config';
import { estimateHeadPoseFromCanvas } from '@/lib/biometrics/pose-estimator';
import { validatePoseForStep } from '@/lib/biometrics/pose-validator';
import { DirectionalFrameCapture, PoseEstimationResult, PoseValidationResult } from '@/lib/biometrics/pose-types';

export interface DirectionalFrame {
  direction: 'NORMAL' | 'LEFT' | 'RIGHT' | 'UP' | 'FRONT' | 'NATURAL';
  image_base64: string;
}

interface MultiAngleFaceEnrollmentProps {
  onComplete: (samples: DirectionalFrame[]) => void;
  onCancel?: () => void;
}

// Audio synthesized chime via Web Audio API
function playChime(freq = 880, duration = 0.08) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio permission blocking
  }
}

function playSuccessDoubleChime() {
  playChime(587, 0.07);
  setTimeout(() => playChime(880, 0.12), 80);
}

export function MultiAngleFaceEnrollment({ onComplete, onCancel }: MultiAngleFaceEnrollmentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<Record<PoseStepId, DirectionalFrameCapture | null>>({
    CENTER: null,
    LEFT: null,
    RIGHT: null,
    UP: null,
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Real-Time Evaluation State
  const [lastValidation, setLastValidation] = useState<PoseValidationResult | null>(null);
  const [isPoseValid, setIsPoseValid] = useState(false);
  const [stabilityProgress, setStabilityProgress] = useState(0); // 0 to 100%
  const [shutterFlash, setShutterFlash] = useState(false);
  const [showCheckmarkOverlay, setShowCheckmarkOverlay] = useState(false);

  // Fast Snappy Stability Hold Tracker (200ms)
  const holdStartTimeRef = useRef<number | null>(null);
  const isAutoSnappingRef = useRef(false);
  const stepTransitionCooldownRef = useRef(Date.now() + 250);

  const currentStep: PoseStepMetadata = POSE_STEPS[currentStepIndex];
  const allCaptured = POSE_STEPS.every((step) => !!capturedFrames[step.id]);

  // Initialize Camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err: any) {
        console.error('Webcam initialization failed:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser to proceed with biometric enrollment.'
            : 'Unable to access camera hardware. Verify that no other application is using the webcam.'
        );
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capture Function
  const executeCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirrored snapshot to match what the user sees
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Audio and Visual Shutter Feedback
    setShutterFlash(true);
    setShowCheckmarkOverlay(true);
    setTimeout(() => setShutterFlash(false), 180);
    setTimeout(() => setShowCheckmarkOverlay(false), 500);
    playSuccessDoubleChime();

    const captureData: DirectionalFrameCapture = {
      stepId: currentStep.id,
      direction: currentStep.backendDirection,
      image_base64: dataUrl,
      capturedYaw: 0,
      capturedPitch: 0,
      capturedTimestamp: Date.now(),
    };

    setCapturedFrames((prev) => ({
      ...prev,
      [currentStep.id]: captureData,
    }));

    // Reset hold timer and brief grace period before evaluating next pose
    holdStartTimeRef.current = null;
    setStabilityProgress(0);
    setIsPoseValid(false);
    stepTransitionCooldownRef.current = Date.now() + DEFAULT_POSE_CONFIG.TRANSITION_COOLDOWN_MS;

    // Auto-advance to next step
    if (currentStepIndex < POSE_STEPS.length - 1) {
      setTimeout(() => {
        setCurrentStepIndex((prev) => Math.min(prev + 1, POSE_STEPS.length - 1));
      }, 350);
    }
  }, [currentStep, currentStepIndex]);

  // Real-Time Frame Processing & Instant Auto-Capture on Tilt
  useEffect(() => {
    if (!cameraActive || allCaptured) return;

    const intervalId = setInterval(() => {
      const video = videoRef.current;
      const analysisCanvas = analysisCanvasRef.current;
      if (!video || !analysisCanvas || video.readyState < 2) return;

      const aWidth = 160;
      const aHeight = 120;
      analysisCanvas.width = aWidth;
      analysisCanvas.height = aHeight;
      const actx = analysisCanvas.getContext('2d');
      if (!actx) return;

      // Draw mirrored frame for analysis
      actx.save();
      actx.translate(aWidth, 0);
      actx.scale(-1, 1);
      actx.drawImage(video, 0, 0, aWidth, aHeight);
      actx.restore();

      // Estimate Pose & Quality
      const estimation: PoseEstimationResult | null = estimateHeadPoseFromCanvas(
        analysisCanvas,
        DEFAULT_POSE_CONFIG
      );

      // Check transition grace period
      if (Date.now() < stepTransitionCooldownRef.current) {
        setIsPoseValid(false);
        holdStartTimeRef.current = null;
        setStabilityProgress(0);
        return;
      }

      // Validate against current step's directional tilt
      const validation = validatePoseForStep(estimation, currentStep.id, DEFAULT_POSE_CONFIG);
      setLastValidation(validation);

      if (validation.isValid) {
        // Correct tilt detected!
        setIsPoseValid(true);

        if (holdStartTimeRef.current === null) {
          holdStartTimeRef.current = Date.now();
        }

        const elapsed = Date.now() - holdStartTimeRef.current;
        const progressPct = Math.min(100, Math.round((elapsed / DEFAULT_POSE_CONFIG.STABILITY_HOLD_MS) * 100));
        setStabilityProgress(progressPct);

        // Auto-capture photo as soon as 200ms hold is satisfied
        if (elapsed >= DEFAULT_POSE_CONFIG.STABILITY_HOLD_MS && !isAutoSnappingRef.current) {
          isAutoSnappingRef.current = true;
          executeCapture();
          setTimeout(() => {
            isAutoSnappingRef.current = false;
          }, 400);
        }
      } else {
        // Wrong direction or no face -> reset timer
        setIsPoseValid(false);
        holdStartTimeRef.current = null;
        setStabilityProgress(0);
      }
    }, 40); // 25 FPS frame evaluation

    return () => clearInterval(intervalId);
  }, [cameraActive, allCaptured, currentStepIndex, currentStep, executeCapture]);

  const handleRetake = (stepId: PoseStepId, index: number) => {
    setCapturedFrames((prev) => ({
      ...prev,
      [stepId]: null,
    }));
    setCurrentStepIndex(index);
    holdStartTimeRef.current = null;
    setStabilityProgress(0);
    setIsPoseValid(false);
    stepTransitionCooldownRef.current = Date.now() + 300;
  };

  const handleFinalSubmit = () => {
    const framesArray: DirectionalFrame[] = POSE_STEPS.map((s) => ({
      direction: s.backendDirection,
      image_base64: capturedFrames[s.id]?.image_base64 || '',
    }));
    onComplete(framesArray);
  };

  const completedCount = POSE_STEPS.filter((s) => !!capturedFrames[s.id]).length;

  const getStepIcon = (id: PoseStepId) => {
    switch (id) {
      case 'CENTER':
        return <User className="w-5 h-5 text-cyan-400" />;
      case 'LEFT':
        return <ArrowLeft className="w-5 h-5 text-cyan-400" />;
      case 'RIGHT':
        return <ArrowRight className="w-5 h-5 text-cyan-400" />;
      case 'UP':
        return <ArrowUp className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 sm:p-6 text-white max-w-2xl mx-auto shadow-2xl relative overflow-hidden select-none"
    >
      {/* Top Laser Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent opacity-80" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-4 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#F9FAFB] flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#22D3EE]" />
            Biometric Face Auto-Capture
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Step {currentStepIndex + 1} of {POSE_STEPS.length}: {currentStep.title}
          </p>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#111318] px-3 py-1 rounded-full border border-[#27272A]">
            <span className="text-xs font-mono font-bold text-[#22D3EE]">
              {completedCount}/{POSE_STEPS.length}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Poses Stepper Tabs */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {POSE_STEPS.map((step, idx) => {
          const isDone = !!capturedFrames[step.id];
          const isCurrent = idx === currentStepIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setCurrentStepIndex(idx);
                holdStartTimeRef.current = null;
                setStabilityProgress(0);
                setIsPoseValid(false);
                stepTransitionCooldownRef.current = Date.now() + 300;
              }}
              className={`flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                isCurrent
                  ? 'border-[#3B82F6] bg-blue-950/40 text-cyan-300 ring-1 ring-blue-500 shadow-md'
                  : isDone
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-[#22C55E]'
                  : 'border-[#27272A] bg-[#111318] text-[#9CA3AF] hover:border-[#3B82F6]/50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                ) : (
                  <span>#{idx + 1}</span>
                )}
                <span>{step.id}</span>
              </div>
              <span className="text-[10px] text-[#9CA3AF] mt-0.5 hidden sm:inline font-mono">
                {isDone ? 'Captured' : isCurrent ? 'Active' : 'Pending'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Camera Viewport & Dynamic Reticle */}
      <div
        className={`relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-inner flex items-center justify-center ${
          isPoseValid
            ? 'border-emerald-500 shadow-[0_0_35px_rgba(34,197,94,0.35)]'
            : 'border-[#27272A]'
        }`}
      >
        {cameraError ? (
          <div className="text-center p-6 max-w-sm">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-200 mb-1">Webcam Required</h4>
            <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Shutter Flash Animation */}
            {shutterFlash && (
              <div className="absolute inset-0 bg-white opacity-95 pointer-events-none transition-opacity duration-150 z-30" />
            )}

            {/* Success Checkmark Animation Overlay on Capture */}
            {showCheckmarkOverlay && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/40 backdrop-blur-[2px] animate-in fade-in zoom-in duration-150">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.8)]">
                  <Check className="w-10 h-10 text-emerald-400 animate-bounce" />
                </div>
              </div>
            )}

            {/* Face-Position Guide Oval with Green Light on Tilt */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div
                className={`relative w-48 h-64 border-3 rounded-[50%] transition-all duration-200 flex flex-col items-center justify-between p-4 ${
                  isPoseValid
                    ? 'border-emerald-400 scale-105 shadow-[0_0_45px_rgba(52,211,153,0.95)] ring-4 ring-emerald-500/30'
                    : 'border-cyan-500/60 border-dashed shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                }`}
              >
                {/* State Tag Badge */}
                <div
                  className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full backdrop-blur transition-colors ${
                    isPoseValid
                      ? 'bg-emerald-500 text-black font-extrabold shadow-md'
                      : 'bg-[#111318]/90 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {isPoseValid ? 'CAPTURING...' : currentStep.title}
                </div>

                {/* Snappy Hold Ring when Green Light Appears */}
                {isPoseValid && (
                  <div className="flex flex-col items-center gap-1.5 animate-in fade-in zoom-in duration-100">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="23"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          className="text-emerald-950"
                          fill="transparent"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="23"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          className="text-emerald-400 transition-all duration-75 ease-linear"
                          fill="transparent"
                          strokeDasharray={144.5}
                          strokeDashoffset={144.5 - (144.5 * stabilityProgress) / 100}
                        />
                      </svg>
                      <Sparkles className="w-5 h-5 text-emerald-400 absolute animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Direction Icon marker */}
                <div
                  className={`p-2 rounded-full backdrop-blur border transition-colors ${
                    isPoseValid
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-black/80 border-[#27272A]'
                  }`}
                >
                  {getStepIcon(currentStep.id)}
                </div>
              </div>
            </div>

            {/* Instruction Banner at Bottom of Viewport */}
            <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md border border-[#27272A] rounded-xl p-2.5 text-center z-20">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isPoseValid
                      ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-ping'
                      : 'bg-cyan-400'
                  }`}
                />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    {currentStep.instruction}
                  </motion.p>
                </AnimatePresence>
              </div>
              <p
                className={`text-[11px] mt-0.5 font-medium transition-colors ${
                  isPoseValid ? 'text-emerald-400 font-semibold' : 'text-[#9CA3AF]'
                }`}
              >
                {lastValidation?.feedbackMessage || 'Position your face inside the guide oval'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Hidden Canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={analysisCanvasRef} className="hidden" />

      {/* Captured Poses Gallery & Submission */}
      <div className="mt-4 space-y-4">
        {/* Thumbnails of the 4 captured poses */}
        <div className="grid grid-cols-4 gap-2">
          {POSE_STEPS.map((s, idx) => {
            const frame = capturedFrames[s.id];
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  holdStartTimeRef.current = null;
                  setStabilityProgress(0);
                  setIsPoseValid(false);
                  stepTransitionCooldownRef.current = Date.now() + 300;
                }}
                className={`relative h-20 rounded-xl overflow-hidden border cursor-pointer group transition-all ${
                  isCurrent
                    ? 'ring-2 ring-blue-500 border-blue-500'
                    : frame
                    ? 'border-emerald-500/60'
                    : 'border-[#27272A] bg-[#111318]'
                }`}
              >
                {frame ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frame.image_base64}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-emerald-500 text-black p-0.5 rounded-full shadow">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[10px] text-center font-bold text-emerald-400 py-0.5">
                      {s.id}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#9CA3AF]">
                    <span className="text-[11px] font-bold">{s.id}</span>
                    <span className="text-[9px] text-[#9CA3AF]/70">Pending</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#27272A]">
          <div>
            {capturedFrames[currentStep.id] ? (
              <button
                type="button"
                onClick={() => handleRetake(currentStep.id, currentStepIndex)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] text-xs font-medium text-[#9CA3AF] hover:text-white transition cursor-pointer border border-[#27272A]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                Retake {currentStep.id} Pose
              </button>
            ) : (
              <p className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Tilt head to auto-capture
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] text-xs font-medium text-[#9CA3AF] hover:text-white transition cursor-pointer border border-[#27272A]"
              >
                Cancel
              </button>
            )}

            {!allCaptured ? (
              <button
                type="button"
                onClick={executeCapture}
                disabled={!cameraActive}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg transition cursor-pointer ${
                  isPoseValid
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40 ring-2 ring-emerald-400'
                    : 'bg-[#3B82F6] hover:bg-blue-600 shadow-blue-500/20'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>
                  Snap {currentStep.id} ({completedCount}/{POSE_STEPS.length})
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/40 animate-pulse transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Biometric Enrollment ({POSE_STEPS.length}/{POSE_STEPS.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
