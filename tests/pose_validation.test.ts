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

describe('🎯 Effortless Head Tilt Auto-Capture Test Suite (15 Scenarios)', () => {

  // Scenario 1: Looking straight at the camera
  it('Scenario 1: should pass CENTER pose when looking straight at camera', () => {
    const straightPose = createMockPose(0, 0);
    const result = validatePoseForStep(straightPose, 'CENTER');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.statusCode, 'VALID');
    assert.strictEqual(result.isDirectionSatisfied, true);
  });

  // Scenario 2: Head tilted left auto-captures on Left step
  it('Scenario 2: should auto-accept LEFT pose on any left tilt (e.g. yaw = -5)', () => {
    const tiltLeft = createMockPose(-5, 0);
    const result = validatePoseForStep(tiltLeft, 'LEFT');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.statusCode, 'VALID');
    assert.strictEqual(result.isDirectionSatisfied, true);
  });

  // Scenario 3: Head tilted further left remains valid
  it('Scenario 3: should auto-accept LEFT pose on wider left tilt (e.g. yaw = -22)', () => {
    const wideLeft = createMockPose(-22, 2);
    const result = validatePoseForStep(wideLeft, 'LEFT');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.statusCode, 'VALID');
    assert.strictEqual(result.isDirectionSatisfied, true);
  });

  // Scenario 4: Reject opposite direction when LEFT is requested
  it('Scenario 4: should reject rightward tilt when LEFT is required (e.g. yaw = +10)', () => {
    const turnedRight = createMockPose(+10, 0);
    const result = validatePoseForStep(turnedRight, 'LEFT');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'TOO_CLOSE_TO_CENTER');
    assert.strictEqual(result.isDirectionSatisfied, false);
  });

  // Scenario 5: Head tilted right auto-captures on Right step
  it('Scenario 5: should auto-accept RIGHT pose on any right tilt (e.g. yaw = +6)', () => {
    const tiltRight = createMockPose(+6, -1);
    const result = validatePoseForStep(tiltRight, 'RIGHT');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.statusCode, 'VALID');
    assert.strictEqual(result.isDirectionSatisfied, true);
  });

  // Scenario 6: Reject opposite direction when RIGHT is requested
  it('Scenario 6: should reject leftward tilt when RIGHT is required (e.g. yaw = -8)', () => {
    const turnedLeft = createMockPose(-8, 0);
    const result = validatePoseForStep(turnedLeft, 'RIGHT');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'TOO_CLOSE_TO_CENTER');
    assert.strictEqual(result.isDirectionSatisfied, false);
  });

  // Scenario 7: Head tilted upward auto-captures on Up step
  it('Scenario 7: should auto-accept UP pose on any upward tilt (e.g. pitch = +4)', () => {
    const tiltUp = createMockPose(2, +4);
    const result = validatePoseForStep(tiltUp, 'UP');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.statusCode, 'VALID');
    assert.strictEqual(result.isDirectionSatisfied, true);
  });

  // Scenario 8: Reject downward tilt when UP is requested
  it('Scenario 8: should reject downward tilt when UP is required (e.g. pitch = -6)', () => {
    const tiltDown = createMockPose(0, -6);
    const result = validatePoseForStep(tiltDown, 'UP');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'TOO_CLOSE_TO_CENTER');
    assert.strictEqual(result.isDirectionSatisfied, false);
  });

  // Scenario 9: Face out of bounds or missing tracking
  it('Scenario 9: should reject when face is partially outside frame or tracking is lost', () => {
    const outOfFrame = createMockPose(-8, 0, { isContainedInFrame: false });
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
    const darkFrame = createMockPose(0, 0, { meanBrightness: 8 });
    const darkResult = validatePoseForStep(darkFrame, 'CENTER');
    assert.strictEqual(darkResult.isValid, false);
    assert.strictEqual(darkResult.statusCode, 'TOO_DARK');

    const glareFrame = createMockPose(0, 0, { meanBrightness: 254 });
    const glareResult = validatePoseForStep(glareFrame, 'CENTER');
    assert.strictEqual(glareResult.isValid, false);
    assert.strictEqual(glareResult.statusCode, 'TOO_BRIGHT');
  });

  // Scenario 11: Image sharpness failure / blurry motion
  it('Scenario 11: should reject blurry frames with low Laplacian sharpness', () => {
    const blurryFrame = createMockPose(-5, 0, { sharpnessScore: 1 });
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
  it('Scenario 13: should not accept extreme right (+20°) when Left pose is requested', () => {
    const rightPose = createMockPose(+20, 0);
    const result = validatePoseForStep(rightPose, 'LEFT');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'TOO_CLOSE_TO_CENTER');
  });

  // Scenario 14: Physical limit bounds
  it('Scenario 14: should reject extreme head angles exceeding camera tracking limit (e.g. -85°)', () => {
    const extremeLeft = createMockPose(-85, 0);
    const result = validatePoseForStep(extremeLeft, 'LEFT');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.statusCode, 'OUTSIDE_PHYSICAL_RANGE');
  });

  // Scenario 15: Clean feedback without degree numbers
  it('Scenario 15: should provide clean user-friendly feedback without degree numbers', () => {
    const leftPose = createMockPose(-6, 0);
    const result = validatePoseForStep(leftPose, 'LEFT');
    assert.strictEqual(result.isValid, true);
    assert.doesNotMatch(result.feedbackMessage, /°/);
    assert.doesNotMatch(result.targetDescription, /°/);
  });

});
