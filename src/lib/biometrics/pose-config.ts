/**
 * AI Smart Attendance System - Head-Pose & Biometric Capture Configuration
 * 
 * Configured for instant, effortless auto-capture on head tilt with zero degree restrictions.
 * Directional tilts:
 * - Straight: Face looking forward at camera
 * - Left: Any tilt/turn to the left
 * - Right: Any tilt/turn to the right
 * - Up: Any tilt upward
 */

export interface PoseThresholdConfig {
  /** Minimum yaw threshold (magnitude) for Left/Right turn. Sensitive to any tilt */
  MIN_YAW_THRESHOLD: number;
  /** Physical camera tracking upper limit for yaw */
  MAX_YAW_PHYSICAL: number;
  /** Minimum pitch threshold (magnitude) for upward tilt. Sensitive to any upward tilt */
  MIN_PITCH_THRESHOLD: number;
  /** Physical camera tracking upper limit for upward pitch */
  MAX_PITCH_PHYSICAL: number;
  /** Allowed yaw deviation from 0° for Center/Frontal pose */
  CENTER_YAW_TOLERANCE: number;
  /** Allowed pitch deviation from 0° for Center/Frontal pose */
  CENTER_PITCH_TOLERANCE: number;
  /** Continuous hold time in milliseconds before auto-capture */
  STABILITY_HOLD_MS: number;
  /** Grace cooldown in milliseconds after advancing to next step */
  TRANSITION_COOLDOWN_MS: number;
  /** Minimum ratio of face bounding box area to camera viewport area */
  MIN_FACE_AREA_RATIO: number;
  /** Maximum ratio of face bounding box area to camera viewport area */
  MAX_FACE_AREA_RATIO: number;
  /** Minimum mean luminance (0-255) for adequate lighting */
  MIN_BRIGHTNESS: number;
  /** Maximum mean luminance (0-255) to prevent glare/overexposure */
  MAX_BRIGHTNESS: number;
  /** Minimum Laplacian sharpness score to reject heavy motion blur */
  MIN_SHARPNESS_SCORE: number;
  /** Minimum skin pixel density */
  MIN_SKIN_DENSITY: number;
}

/**
 * Institutional Pose Configuration with zero degree friction:
 * Any tilt to the left -> captures Left!
 * Any tilt to the right -> captures Right!
 * Looking forward -> captures Straight!
 * Any tilt upward -> captures Up!
 */
export const DEFAULT_POSE_CONFIG: PoseThresholdConfig = {
  MIN_YAW_THRESHOLD: 1,          // Triggers on any left/right tilt
  MAX_YAW_PHYSICAL: 75,          // Wide physical tracking range
  MIN_PITCH_THRESHOLD: 1,        // Triggers on any upward tilt
  MAX_PITCH_PHYSICAL: 70,        // Wide physical tracking range
  CENTER_YAW_TOLERANCE: 14,      // Wide comfortable frontal window
  CENTER_PITCH_TOLERANCE: 14,    // Wide comfortable frontal window
  STABILITY_HOLD_MS: 200,        // Responsive 200ms snappy auto-capture
  TRANSITION_COOLDOWN_MS: 300,   // Quick transition between steps
  MIN_FACE_AREA_RATIO: 0.04,     // Very forgiving face distance
  MAX_FACE_AREA_RATIO: 0.90,     // Very forgiving close-up
  MIN_BRIGHTNESS: 15,            // Operates in low/dim room lighting
  MAX_BRIGHTNESS: 250,           // Non-washed out
  MIN_SHARPNESS_SCORE: 3,        // Minimal blur barrier
  MIN_SKIN_DENSITY: 0.04,        // Responsive skin detection
};

export type PoseStepId = 'CENTER' | 'LEFT' | 'RIGHT' | 'UP';

export interface PoseStepMetadata {
  id: PoseStepId;
  stepNumber: number;
  title: string;
  instruction: string;
  angleConditionDescription: string;
  backendDirection: 'NORMAL' | 'LEFT' | 'RIGHT' | 'UP';
}

export const POSE_STEPS: PoseStepMetadata[] = [
  {
    id: 'CENTER',
    stepNumber: 1,
    title: 'Look Straight',
    instruction: 'Look straight at the camera',
    angleConditionDescription: 'Center / Straight',
    backendDirection: 'NORMAL',
  },
  {
    id: 'LEFT',
    stepNumber: 2,
    title: 'Tilt Left',
    instruction: 'Tilt your head to the left',
    angleConditionDescription: 'Head Tilt Left',
    backendDirection: 'LEFT',
  },
  {
    id: 'RIGHT',
    stepNumber: 3,
    title: 'Tilt Right',
    instruction: 'Tilt your head to the right',
    angleConditionDescription: 'Head Tilt Right',
    backendDirection: 'RIGHT',
  },
  {
    id: 'UP',
    stepNumber: 4,
    title: 'Tilt Upward',
    instruction: 'Tilt your head upward',
    angleConditionDescription: 'Head Tilt Up',
    backendDirection: 'UP',
  },
];
