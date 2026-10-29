/**
 * AI Smart Attendance System - Head-Pose Mathematical Validator
 * 
 * Implements strict mathematical inequalities and quality gates for the 4 registration poses:
 * 1. CENTER:  |yaw| <= 8° AND |pitch| <= 8°
 * 2. LEFT:    yaw <= -10° AND yaw >= -45°  (Negative yaw heading toward -infinity, bounded by physical camera limit)
 * 3. RIGHT:   yaw >= +10° AND yaw <= +45°  (Positive yaw heading toward +infinity, bounded by physical camera limit)
 * 4. UP:      pitch >= +10° AND pitch <= +40° (Positive pitch upward, bounded by physical camera limit)
 * 
 * Rejects:
 * - Angles too close to center when turning left/right/up
 * - Extreme angles where face tracking is lost or out of physical limits
 * - Underexposed / overexposed frames
 * - Blurry frames
 * - Multiple faces or no face
 */

import { DEFAULT_POSE_CONFIG, PoseStepId, PoseThresholdConfig } from './pose-config';
import { PoseEstimationResult, PoseValidationResult } from './pose-types';

export function validatePoseForStep(
  estimation: PoseEstimationResult | null,
  stepId: PoseStepId,
  config: PoseThresholdConfig = DEFAULT_POSE_CONFIG
): PoseValidationResult {
  // 1. Detection Presence Gate
  if (!estimation || !estimation.isTrackingReliable) {
    return {
      isValid: false,
      statusCode: 'NO_FACE',
      feedbackMessage: 'Position your face inside the guide frame',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: 0,
      currentPitch: 0,
      targetDescription: getStepTargetDescription(stepId, config),
    };
  }

  const { angles, quality } = estimation;
  const yaw = angles.yaw;
  const pitch = angles.pitch;

  // 2. Multi-Face Gate (Exactly one face required)
  if (quality.faceCount > 1 || !quality.isSingleFace) {
    return {
      isValid: false,
      statusCode: 'MULTIPLE_FACES',
      feedbackMessage: 'Multiple faces detected — only one person permitted during registration',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId, config),
    };
  }

  // 3. Framing & Boundary Containment Gate
  if (!quality.isContainedInFrame) {
    return {
      isValid: false,
      statusCode: 'FACE_OUT_OF_BOUNDS',
      feedbackMessage: 'Face partially out of frame — center yourself in the guide oval',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId, config),
    };
  }

  // 4. Face Size / Distance Gate
  if (quality.faceAreaRatio < config.MIN_FACE_AREA_RATIO) {
    return {
      isValid: false,
      statusCode: 'FACE_TOO_FAR',
      feedbackMessage: 'Move closer to the camera',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId, config),
    };
  }
  if (quality.faceAreaRatio > config.MAX_FACE_AREA_RATIO) {
    return {
      isValid: false,
      statusCode: 'FACE_TOO_CLOSE',
      feedbackMessage: 'Move slightly further back from the camera',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId, config),
    };
  }

  // 5. Illumination & Glare Gate
  if (quality.meanBrightness < config.MIN_BRIGHTNESS) {
    return {
      isValid: false,
      statusCode: 'TOO_DARK',
      feedbackMessage: 'Lighting too dim — please face a light source',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId, config),
    };
  }
  if (quality.meanBrightness > config.MAX_BRIGHTNESS) {
    return {
      isValid: false,
      statusCode: 'TOO_BRIGHT',
      feedbackMessage: 'Lighting too bright or glare detected — adjust lighting',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId, config),
    };
  }

  // 6. Image Sharpness Gate
  if (quality.sharpnessScore < config.MIN_SHARPNESS_SCORE) {
    return {
      isValid: false,
      statusCode: 'BLURRY',
      feedbackMessage: 'Image is blurry — hold still for clear biometric capture',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId, config),
    };
  }

  const isQualitySatisfied = true;

  // 7. Mathematical Head-Pose Directional Validation
  let isDirectionSatisfied = false;
  let statusCode: PoseValidationResult['statusCode'] = 'VALID';
  let feedbackMessage = '';

  switch (stepId) {
    case 'CENTER': {
      // CENTER: |yaw| <= tolerance AND |pitch| <= tolerance
      const isYawCentered = Math.abs(yaw) <= config.CENTER_YAW_TOLERANCE;
      const isPitchCentered = Math.abs(pitch) <= config.CENTER_PITCH_TOLERANCE;

      if (isYawCentered && isPitchCentered) {
        isDirectionSatisfied = true;
        feedbackMessage = '✓ Frontal pose aligned. Hold still...';
      } else {
        statusCode = 'INCORRECT_DIRECTION';
        if (!isYawCentered) {
          feedbackMessage = yaw < 0 ? 'Turn slightly to your right to center' : 'Turn slightly to your left to center';
        } else {
          feedbackMessage = pitch > 0 ? 'Level your chin slightly down' : 'Level your chin slightly up';
        }
      }
      break;
    }

    case 'LEFT': {
      // LEFT: Mathematical inequality: yaw <= -MIN_YAW_THRESHOLD
      // Physically bound by: yaw >= -MAX_YAW_PHYSICAL
      // Reject if too close to center: yaw > -MIN_YAW_THRESHOLD
      if (yaw > -config.MIN_YAW_THRESHOLD) {
        // Too close to center or turning right
        statusCode = 'TOO_CLOSE_TO_CENTER';
        feedbackMessage = `Turn your head slightly more to your LEFT (reach ≤ -${config.MIN_YAW_THRESHOLD}°)`;
      } else if (yaw < -config.MAX_YAW_PHYSICAL) {
        // Exceeded physical tracking limit
        statusCode = 'OUTSIDE_PHYSICAL_RANGE';
        feedbackMessage = 'Turned too far left — turn slightly back toward center';
      } else {
        // Valid Left pose range: [-MAX_YAW_PHYSICAL, -MIN_YAW_THRESHOLD]
        isDirectionSatisfied = true;
        feedbackMessage = '✓ Left pose verified. Hold still...';
      }
      break;
    }

    case 'RIGHT': {
      // RIGHT: Mathematical inequality: yaw >= +MIN_YAW_THRESHOLD
      // Physically bound by: yaw <= +MAX_YAW_PHYSICAL
      // Reject if too close to center: yaw < +MIN_YAW_THRESHOLD
      if (yaw < config.MIN_YAW_THRESHOLD) {
        // Too close to center or turning left
        statusCode = 'TOO_CLOSE_TO_CENTER';
        feedbackMessage = `Turn your head slightly more to your RIGHT (reach ≥ +${config.MIN_YAW_THRESHOLD}°)`;
      } else if (yaw > config.MAX_YAW_PHYSICAL) {
        // Exceeded physical tracking limit
        statusCode = 'OUTSIDE_PHYSICAL_RANGE';
        feedbackMessage = 'Turned too far right — turn slightly back toward center';
      } else {
        // Valid Right pose range: [+MIN_YAW_THRESHOLD, +MAX_YAW_PHYSICAL]
        isDirectionSatisfied = true;
        feedbackMessage = '✓ Right pose verified. Hold still...';
      }
      break;
    }

    case 'UP': {
      // UP: Mathematical inequality: pitch >= +MIN_PITCH_THRESHOLD
      // Physically bound by: pitch <= +MAX_PITCH_PHYSICAL
      // Reject if too close to center: pitch < +MIN_PITCH_THRESHOLD
      if (pitch < config.MIN_PITCH_THRESHOLD) {
        // Too close to level center or tilting down
        statusCode = 'TOO_CLOSE_TO_CENTER';
        feedbackMessage = `Tilt your chin slightly more UPWARD (reach ≥ +${config.MIN_PITCH_THRESHOLD}°)`;
      } else if (pitch > config.MAX_PITCH_PHYSICAL) {
        // Exceeded physical tracking limit
        statusCode = 'OUTSIDE_PHYSICAL_RANGE';
        feedbackMessage = 'Tilted too high — lower your chin slightly';
      } else {
        // Valid Upward pose range: [+MIN_PITCH_THRESHOLD, +MAX_PITCH_PHYSICAL]
        isDirectionSatisfied = true;
        feedbackMessage = '✓ Upward pose verified. Hold still...';
      }
      break;
    }
  }

  const isValid = isQualitySatisfied && isDirectionSatisfied;

  return {
    isValid,
    statusCode: isValid ? 'VALID' : statusCode,
    feedbackMessage: isValid ? feedbackMessage : feedbackMessage,
    isDirectionSatisfied,
    isQualitySatisfied,
    currentYaw: yaw,
    currentPitch: pitch,
    targetDescription: getStepTargetDescription(stepId, config),
  };
}

function getStepTargetDescription(stepId: PoseStepId, config: PoseThresholdConfig): string {
  switch (stepId) {
    case 'CENTER':
      return `Center (|Yaw| ≤ ${config.CENTER_YAW_TOLERANCE}°, |Pitch| ≤ ${config.CENTER_PITCH_TOLERANCE}°)`;
    case 'LEFT':
      return `Turn Left (Yaw ≤ -${config.MIN_YAW_THRESHOLD}°)`;
    case 'RIGHT':
      return `Turn Right (Yaw ≥ +${config.MIN_YAW_THRESHOLD}°)`;
    case 'UP':
      return `Tilt Upward (Pitch ≥ +${config.MIN_PITCH_THRESHOLD}°)`;
  }
}
