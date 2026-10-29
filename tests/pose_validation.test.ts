import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validatePoseForStep } from '../src/lib/biometrics/pose-validator';
import { DEFAULT_POSE_CONFIG, PoseThresholdConfig } from '../src/lib/biometrics/pose-config';
import { PoseEstimationResult } from '../src/lib/biometrics/pose-types';

function createMockPose(
  yaw: number,
  pitch: number,
  overrides?: Partial<PoseEstimationResult['quality']>
): PoseEstimationResult {
  return {
    angles: { yaw, pitch, roll: 0 },
    boundingBox: { x: 50, y: 50, width: 200, height: 250 },
    rawConfidence: 0.95,
    isTrackingReliable: true,
    quality: {
      faceCount: 1,
      isSingleFace: true,
      isContainedInFrame: true,
      faceAreaRatio: 0.25,
      isSizeAdequate: true,
      meanBrightness: 120,
      isLightingGood: true,
      sharpnessScore: 25,
      isSharp: true,
      skinDensity: 0.22,
      ...overrides,
    },
  };
}

describe('🎯 Head Pose Validation & Strict Stability Suite (15 Scenarios)', () => {

  // Scenario 1: A student looking straight at the camera
  it('Scenario 1: should pass CENTER pose when looking straight at the camera', () => {
    const straightPose = createMockPose(0, 0);
    const result = validatePoseForStep(straightPose, 'CENTER');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.statusCode, 'VALID');
    assert.strictEqual(result.isDirectionSatisfied, true);
  });

  // Scenario 2: A slight left turn that remains below the threshold
  it('Scenario 2: should reject a slight left turn that remains below the negative threshold (e.g. -6° vs -10°)', () => {
    const slightLeft = createMockPose(-6, 0);
    const result = validatePoseForStep(slightLeft, 'LEFT');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'TOO_CLOSE_TO_CENTER');
    assert.strictEqual(result.isDirectionSatisfied, false);
  });

  // Scenario 3: A valid left turn
  it('Scenario 3: should accept a valid left turn when yaw reaches negative threshold (e.g. -18° <= -10°)', () => {
    const validLeft = createMockPose(-18, 2);
    const result = validatePoseForStep(validLeft, 'LEFT');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.statusCode, 'VALID');
    assert.strictEqual(result.isDirectionSatisfied, true);
  });

  // Scenario 4: A slight right turn that remains below the threshold
  it('Scenario 4: should reject a slight right turn that remains below the positive threshold (e.g. +6° vs +10°)', () => {
    const slightRight = createMockPose(+6, 0);
    const result = validatePoseForStep(slightRight, 'RIGHT');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'TOO_CLOSE_TO_CENTER');
    assert.strictEqual(result.isDirectionSatisfied, false);
  });

  // Scenario 5: A valid right turn
  it('Scenario 5: should accept a valid right turn when yaw reaches positive threshold (e.g. +22° >= +10°)', () => {
    const validRight = createMockPose(+22, -1);
    const result = validatePoseForStep(validRight, 'RIGHT');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.statusCode, 'VALID');
    assert.strictEqual(result.isDirectionSatisfied, true);
  });

  // Scenario 6: An upward tilt below the threshold
  it('Scenario 6: should reject an upward tilt that remains below the pitch threshold (e.g. +5° vs +10°)', () => {
    const slightUp = createMockPose(0, +5);
    const result = validatePoseForStep(slightUp, 'UP');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'TOO_CLOSE_TO_CENTER');
    assert.strictEqual(result.isDirectionSatisfied, false);
  });

  // Scenario 7: A valid upward tilt
  it('Scenario 7: should accept a valid upward tilt when pitch reaches upward threshold (e.g. +19° >= +10°)', () => {
    const validUp = createMockPose(2, +19);
    const result = validatePoseForStep(validUp, 'UP');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.statusCode, 'VALID');
    assert.strictEqual(result.isDirectionSatisfied, true);
  });

  // Scenario 8: Moving between poses too quickly (simulating timer reset)
  it('Scenario 8: should correctly identify pose transitions and reset stability if angle departs accepted window', () => {
    // Starts valid Left (-16°)
    const frame1 = createMockPose(-16, 0);
    const res1 = validatePoseForStep(frame1, 'LEFT');
    assert.strictEqual(res1.isValid, true);

    // Moves back too quickly towards center (-4°) before 700ms elapses
    const frame2 = createMockPose(-4, 0);
    const res2 = validatePoseForStep(frame2, 'LEFT');
    assert.strictEqual(res2.isValid, false);
    assert.strictEqual(res2.statusCode, 'TOO_CLOSE_TO_CENTER');
  });

  // Scenario 9: A face that leaves the camera frame or tracking lost
  it('Scenario 9: should reject when face is partially outside frame or tracking is lost', () => {
    const outOfFrame = createMockPose(-18, 0, { isContainedInFrame: false });
    const result = validatePoseForStep(outOfFrame, 'LEFT');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'FACE_OUT_OF_BOUNDS');

    const noFace = null;
    const noFaceResult = validatePoseForStep(noFace, 'CENTER');
    assert.strictEqual(noFaceResult.isValid, false);
    assert.strictEqual(noFaceResult.statusCode, 'NO_FACE');
  });

  // Scenario 10: Poor lighting or excessive glare
  it('Scenario 10: should reject underexposed (too dark) and overexposed (glare) images', () => {
    const darkFrame = createMockPose(0, 0, { meanBrightness: 15 });
    const darkResult = validatePoseForStep(darkFrame, 'CENTER');
    assert.strictEqual(darkResult.isValid, false);
    assert.strictEqual(darkResult.statusCode, 'TOO_DARK');

    const glareFrame = createMockPose(0, 0, { meanBrightness: 250 });
    const glareResult = validatePoseForStep(glareFrame, 'CENTER');
    assert.strictEqual(glareResult.isValid, false);
    assert.strictEqual(glareResult.statusCode, 'TOO_BRIGHT');
  });

  // Scenario 11: Image sharpness failure / blurry motion
  it('Scenario 11: should reject blurry or low-sharpness images', () => {
    const blurryFrame = createMockPose(-15, 0, { sharpnessScore: 4 });
    const blurryResult = validatePoseForStep(blurryFrame, 'LEFT');
    assert.strictEqual(blurryResult.isValid, false);
    assert.strictEqual(blurryResult.statusCode, 'BLURRY');
  });

  // Scenario 12: Multiple faces in the frame
  it('Scenario 12: should strictly reject multiple faces in camera frame', () => {
    const multiFaceFrame = createMockPose(0, 0, { faceCount: 2, isSingleFace: false });
    const result = validatePoseForStep(multiFaceFrame, 'CENTER');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'MULTIPLE_FACES');
  });

  // Scenario 13: Prevent one pose from being accepted as another
  it('Scenario 13: should prevent Right pose (+20°) from satisfying Left pose step (yaw <= -10°)', () => {
    const rightPose = createMockPose(+20, 0);
    const result = validatePoseForStep(rightPose, 'LEFT');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'TOO_CLOSE_TO_CENTER');
  });

  // Scenario 14: Physical limit bounds (reject extreme unattainable angles)
  it('Scenario 14: should reject extreme head angles exceeding physical camera tracking limits (e.g. -55°)', () => {
    const extremeLeft = createMockPose(-55, 0);
    const result = validatePoseForStep(extremeLeft, 'LEFT');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'OUTSIDE_PHYSICAL_RANGE');
  });

  // Scenario 15: Configurable thresholds support
  it('Scenario 15: should respect custom configurable thresholds (e.g. higher threshold 15°)', () => {
    const customConfig: PoseThresholdConfig = {
      ...DEFAULT_POSE_CONFIG,
      MIN_YAW_THRESHOLD: 15, // Custom stricter threshold
    };

    // Yaw is -12°: Passes default 10° threshold, but fails custom 15° threshold
    const testPose = createMockPose(-12, 0);

    const defaultResult = validatePoseForStep(testPose, 'LEFT', DEFAULT_POSE_CONFIG);
    assert.strictEqual(defaultResult.isValid, true);

    const customResult = validatePoseForStep(testPose, 'LEFT', customConfig);
    assert.strictEqual(customResult.isValid, false);
    assert.strictEqual(customResult.statusCode, 'TOO_CLOSE_TO_CENTER');
  });

});
