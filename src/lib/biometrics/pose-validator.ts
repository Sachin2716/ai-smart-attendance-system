/**
 * AI Smart Attendance System - Head-Pose Validator
 * 
 * Effortless auto-capture on head tilt with zero degree friction:
 * 1. CENTER: Looking straight at the camera.
 * 2. LEFT: Any tilt/turn of the head to the left.
 * 3. RIGHT: Any tilt/turn of the head to the right.
 * 4. UP: Any tilt of the head upward.
 * 
 * No degree numbers or complex angle restrictions displayed or required.
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
      targetDescription: getStepTargetDescription(stepId),
    };
  }

  const { angles, quality } = estimation;
  const yaw = angles.yaw;
  const pitch = angles.pitch;

  // 2. Multi-Face Gate (Single person only)
  if (quality.faceCount > 1 || !quality.isSingleFace) {
    return {
      isValid: false,
      statusCode: 'MULTIPLE_FACES',
      feedbackMessage: 'Multiple faces detected — only one person permitted',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId),
    };
  }

  // 3. Framing & Boundary Containment Gate
  if (!quality.isContainedInFrame) {
    return {
      isValid: false,
      statusCode: 'FACE_OUT_OF_BOUNDS',
      feedbackMessage: 'Face partially out of frame — position inside guide oval',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId),
    };
  }

  // 4. Illumination
  if (quality.meanBrightness < config.MIN_BRIGHTNESS) {
    return {
      isValid: false,
      statusCode: 'TOO_DARK',
      feedbackMessage: 'Lighting too dim — please face a light source',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId),
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
      targetDescription: getStepTargetDescription(stepId),
    };
  }

  // 5. Image Sharpness Gate
  if (quality.sharpnessScore < config.MIN_SHARPNESS_SCORE) {
    return {
      isValid: false,
      statusCode: 'BLURRY',
      feedbackMessage: 'Hold still for a clear photo',
      isDirectionSatisfied: false,
      isQualitySatisfied: false,
      currentYaw: yaw,
      currentPitch: pitch,
      targetDescription: getStepTargetDescription(stepId),
    };
  }

  const isQualitySatisfied = true;

  // 6. Directional Tilt Detection (Zero Degree Friction)
  let isDirectionSatisfied = false;
  let statusCode: PoseValidationResult['statusCode'] = 'VALID';
  let feedbackMessage = '';

  switch (stepId) {
    case 'CENTER': {
      // CENTER: Looking forward
      const isCentered = Math.abs(yaw) <= config.CENTER_YAW_TOLERANCE && Math.abs(pitch) <= config.CENTER_PITCH_TOLERANCE;
      if (isCentered) {
        isDirectionSatisfied = true;
        feedbackMessage = '✓ Looking straight — auto-capturing...';
      } else {
        statusCode = 'INCORRECT_DIRECTION';
        feedbackMessage = 'Look straight at the camera';
      }
      break;
    }

    case 'LEFT': {
      // LEFT: User tilts head to their left (yaw negative)
      if (yaw <= -config.MIN_YAW_THRESHOLD && yaw >= -config.MAX_YAW_PHYSICAL) {
        isDirectionSatisfied = true;
        feedbackMessage = '✓ Left tilt detected — auto-capturing...';
      } else if (yaw < -config.MAX_YAW_PHYSICAL) {
        statusCode = 'OUTSIDE_PHYSICAL_RANGE';
        feedbackMessage = 'Turned too far left — bring face slightly toward center';
      } else {
        statusCode = 'TOO_CLOSE_TO_CENTER';
        feedbackMessage = 'Tilt your head to the left';
      }
      break;
    }

    case 'RIGHT': {
      // RIGHT: User tilts head to their right (yaw positive)
      if (yaw >= config.MIN_YAW_THRESHOLD && yaw <= config.MAX_YAW_PHYSICAL) {
        isDirectionSatisfied = true;
        feedbackMessage = '✓ Right tilt detected — auto-capturing...';
      } else if (yaw > config.MAX_YAW_PHYSICAL) {
        statusCode = 'OUTSIDE_PHYSICAL_RANGE';
        feedbackMessage = 'Turned too far right — bring face slightly toward center';
      } else {
        statusCode = 'TOO_CLOSE_TO_CENTER';
        feedbackMessage = 'Tilt your head to the right';
      }
      break;
    }

    case 'UP': {
      // UP: User tilts head upward (pitch positive)
      if (pitch >= config.MIN_PITCH_THRESHOLD && pitch <= config.MAX_PITCH_PHYSICAL) {
        isDirectionSatisfied = true;
        feedbackMessage = '✓ Upward tilt detected — auto-capturing...';
      } else if (pitch > config.MAX_PITCH_PHYSICAL) {
        statusCode = 'OUTSIDE_PHYSICAL_RANGE';
        feedbackMessage = 'Tilted too high — lower your chin slightly';
      } else {
        statusCode = 'TOO_CLOSE_TO_CENTER';
        feedbackMessage = 'Tilt your head upward';
      }
      break;
    }
  }

  const isValid = isQualitySatisfied && isDirectionSatisfied;

  return {
    isValid,
    statusCode: isValid ? 'VALID' : statusCode,
    feedbackMessage,
    isDirectionSatisfied,
    isQualitySatisfied,
    currentYaw: yaw,
    currentPitch: pitch,
    targetDescription: getStepTargetDescription(stepId),
  };
}

function getStepTargetDescription(stepId: PoseStepId): string {
  switch (stepId) {
    case 'CENTER':
      return 'Look Straight';
    case 'LEFT':
      return 'Tilt Left';
    case 'RIGHT':
      return 'Tilt Right';
    case 'UP':
      return 'Tilt Upward';
  }
}
