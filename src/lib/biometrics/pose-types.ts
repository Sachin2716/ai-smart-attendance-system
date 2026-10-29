/**
 * Biometric Head-Pose & Quality Types
 */

import { PoseStepId } from './pose-config';

export interface HeadPoseAngles {
  /**
   * Horizontal head rotation in degrees.
   * Negative (< 0): User turning to their LEFT.
   * Positive (> 0): User turning to their RIGHT.
   * Approximately 0: Centered / Frontal.
   */
  yaw: number;

  /**
   * Vertical head rotation in degrees.
   * Positive (> 0): User tilting head UPWARD.
   * Negative (< 0): User tilting head DOWNWARD.
   * Approximately 0: Level / Neutral.
   */
  pitch: number;

  /**
   * In-plane head tilt in degrees (clockwise / counter-clockwise).
   */
  roll: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FacialLandmarkPoints {
  leftEyeCenter: { x: number; y: number };
  rightEyeCenter: { x: number; y: number };
  noseTip: { x: number; y: number };
  mouthCenter: { x: number; y: number };
  chinBottom: { x: number; y: number };
}

export interface QualityMetrics {
  faceCount: number;
  isSingleFace: boolean;
  isContainedInFrame: boolean;
  faceAreaRatio: number;
  isSizeAdequate: boolean;
  meanBrightness: number;
  isLightingGood: boolean;
  sharpnessScore: number;
  isSharp: boolean;
  skinDensity: number;
}

export interface PoseEstimationResult {
  angles: HeadPoseAngles;
  boundingBox: BoundingBox;
  landmarks?: FacialLandmarkPoints;
  quality: QualityMetrics;
  rawConfidence: number;
  isTrackingReliable: boolean;
}

export type PoseValidationStatusCode =
  | 'VALID'
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'FACE_OUT_OF_BOUNDS'
  | 'FACE_TOO_FAR'
  | 'FACE_TOO_CLOSE'
  | 'TOO_DARK'
  | 'TOO_BRIGHT'
  | 'BLURRY'
  | 'TOO_CLOSE_TO_CENTER'
  | 'OUTSIDE_PHYSICAL_RANGE'
  | 'INCORRECT_DIRECTION';

export interface PoseValidationResult {
  isValid: boolean;
  statusCode: PoseValidationStatusCode;
  feedbackMessage: string;
  isDirectionSatisfied: boolean;
  isQualitySatisfied: boolean;
  currentYaw: number;
  currentPitch: number;
  targetDescription: string;
}

export interface DirectionalFrameCapture {
  stepId: PoseStepId;
  direction: 'NORMAL' | 'LEFT' | 'RIGHT' | 'UP' | 'FRONT' | 'NATURAL';
  image_base64: string;
  capturedYaw: number;
  capturedPitch: number;
  capturedTimestamp: number;
}
