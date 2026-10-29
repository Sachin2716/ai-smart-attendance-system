/**
 * AI Smart Attendance System - Head-Pose & Biometric Capture Configuration
 * 
 * Central configuration file for all head-pose angle thresholds, stability timing,
 * quality validation limits, and physical camera bounds.
 */

export interface PoseThresholdConfig {
  /** Minimum angular threshold (magnitude in degrees) for Left/Right turn. Initially 10° */
  MIN_YAW_THRESHOLD: number;
  /** Physical camera tracking upper limit for yaw (beyond this, face loses depth landmarks) */
  MAX_YAW_PHYSICAL: number;
  /** Minimum angular threshold (magnitude in degrees) for upward tilt. Initially 10° */
  MIN_PITCH_THRESHOLD: number;
  /** Physical camera tracking upper limit for upward pitch */
  MAX_PITCH_PHYSICAL: number;
  /** Allowed yaw deviation from 0° for Center/Frontal pose */
  CENTER_YAW_TOLERANCE: number;
  /** Allowed pitch deviation from 0° for Center/Frontal pose */
  CENTER_PITCH_TOLERANCE: number;
  /** Strict continuous hold time in milliseconds required before auto-capture */
  STABILITY_HOLD_MS: number;
  /** Grace cooldown in milliseconds after advancing to next step to let user adjust */
  TRANSITION_COOLDOWN_MS: number;
  /** Minimum ratio of face bounding box area to camera viewport area */
  MIN_FACE_AREA_RATIO: number;
  /** Maximum ratio of face bounding box area to camera viewport area */
  MAX_FACE_AREA_RATIO: number;
  /** Minimum mean luminance (0-255) for adequate lighting */
  MIN_BRIGHTNESS: number;
  /** Maximum mean luminance (0-255) to prevent glare/overexposure */
  MAX_BRIGHTNESS: number;
  /** Minimum Laplacian/gradient sharpness score to reject motion blur */
  MIN_SHARPNESS_SCORE: number;
  /** Minimum skin pixel chrominance density in oval */
  MIN_SKIN_DENSITY: number;
}

/**
 * Default Institutional Pose Threshold Configuration
 * 
 * Sign Conventions:
 * - Left Head Turn: Negative yaw angles (yaw <= -MIN_YAW_THRESHOLD, e.g. <= -10°)
 * - Right Head Turn: Positive yaw angles (yaw >= +MIN_YAW_THRESHOLD, e.g. >= +10°)
 * - Upward Head Tilt: Positive pitch angles (pitch >= +MIN_PITCH_THRESHOLD, e.g. >= +10°)
 * - Straight / Center: |yaw| <= CENTER_YAW_TOLERANCE and |pitch| <= CENTER_PITCH_TOLERANCE
 */
export const DEFAULT_POSE_CONFIG: PoseThresholdConfig = {
  MIN_YAW_THRESHOLD: 10,         // Adjustable minimum threshold for left/right
  MAX_YAW_PHYSICAL: 45,          // Physical upper bound for camera visibility
  MIN_PITCH_THRESHOLD: 10,       // Adjustable minimum threshold for upward tilt
  MAX_PITCH_PHYSICAL: 40,        // Physical upper bound for upward tilt
  CENTER_YAW_TOLERANCE: 8,       // Center frontal yaw window: [-8°, +8°]
  CENTER_PITCH_TOLERANCE: 8,     // Center frontal pitch window: [-8°, +10°]
  STABILITY_HOLD_MS: 700,        // 700 milliseconds of strict continuous stability
  TRANSITION_COOLDOWN_MS: 600,   // 600ms grace period between poses
  MIN_FACE_AREA_RATIO: 0.08,     // At least 8% of frame area
  MAX_FACE_AREA_RATIO: 0.70,     // At most 70% of frame area
  MIN_BRIGHTNESS: 25,            // Non-dark frame
  MAX_BRIGHTNESS: 245,           // Non-washed-out frame
  MIN_SHARPNESS_SCORE: 10,       // Blur threshold
  MIN_SKIN_DENSITY: 0.09,        // Sufficient face skin presence
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
    title: 'Center / Straight Pose',
    instruction: 'Look straight at the camera. Keep your head centered.',
    angleConditionDescription: '|Yaw| ≤ 8°, |Pitch| ≤ 8°',
    backendDirection: 'NORMAL',
  },
  {
    id: 'LEFT',
    stepNumber: 2,
    title: 'Turn Left',
    instruction: 'Turn your head slightly to your left.',
    angleConditionDescription: 'Yaw ≤ -10° (Negative angle)',
    backendDirection: 'LEFT',
  },
  {
    id: 'RIGHT',
    stepNumber: 3,
    title: 'Turn Right',
    instruction: 'Turn your head slightly to your right.',
    angleConditionDescription: 'Yaw ≥ +10° (Positive angle)',
    backendDirection: 'RIGHT',
  },
  {
    id: 'UP',
    stepNumber: 4,
    title: 'Tilt Upward',
    instruction: 'Tilt your head slightly upward.',
    angleConditionDescription: 'Pitch ≥ +10° (Upward angle)',
    backendDirection: 'UP',
  },
];
