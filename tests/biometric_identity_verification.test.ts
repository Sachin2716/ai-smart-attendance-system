import { describe, it } from 'node:test';
import assert from 'node:assert';
import sharp from 'sharp';
import {
  extractFaceBiometricVector,
  calculateCosineSimilarity,
  generateDeterministicFaceEmbedding,
  detectFacesAndCount,
  checkPassiveFaceLiveness,
} from '../src/lib/biometrics/fallback-embedding';

// 10 Distinct Facial Archetypes representing realistic student biometric profiles
const ARCHETYPES = [
  // 1. Slender oval, narrow eyes, high eyebrows, fair
  { rx: 32, ry: 58, eyeDist: 28, eyeY: 54, eyeR: 3.5, noseH: 16, mouthW: 18, mouthY: 114, skin: '#fce5cd', bg: '#1c1e24' },
  // 2. Wide square face, wide-set eyes, tanned
  { rx: 50, ry: 44, eyeDist: 50, eyeY: 64, eyeR: 5.5, noseH: 24, mouthW: 38, mouthY: 106, skin: '#d5a6bd', bg: '#232b2b' },
  // 3. Round face, large eyes, deep tone
  { rx: 46, ry: 46, eyeDist: 38, eyeY: 68, eyeR: 6.5, noseH: 14, mouthW: 36, mouthY: 102, skin: '#783f04', bg: '#2e1c2b' },
  // 4. Heart-shaped face, medium eye width, olive
  { rx: 42, ry: 50, eyeDist: 40, eyeY: 58, eyeR: 4.5, noseH: 20, mouthW: 24, mouthY: 110, skin: '#b6d7a8', bg: '#1a1a24' },
  // 5. Long angular face, close-set eyes, golden tone
  { rx: 34, ry: 60, eyeDist: 26, eyeY: 52, eyeR: 4.0, noseH: 26, mouthW: 20, mouthY: 118, skin: '#f9cb9c', bg: '#33272a' },
  // 6. Broad rectangular face, heavy brow, warm bronze
  { rx: 52, ry: 48, eyeDist: 48, eyeY: 70, eyeR: 5.0, noseH: 20, mouthW: 40, mouthY: 104, skin: '#a64d79', bg: '#1b263b' },
  // 7. Compact oval, high nose, light tan
  { rx: 38, ry: 48, eyeDist: 34, eyeY: 62, eyeR: 4.0, noseH: 22, mouthW: 28, mouthY: 108, skin: '#ffe599', bg: '#252525' },
  // 8. Diamond face, wide cheekbones, dark rich tone
  { rx: 48, ry: 42, eyeDist: 44, eyeY: 64, eyeR: 6.0, noseH: 16, mouthW: 34, mouthY: 100, skin: '#4c1130', bg: '#242038' },
  // 9. Tall narrow face, downward tilt, fair porcelain
  { rx: 30, ry: 56, eyeDist: 32, eyeY: 56, eyeR: 3.5, noseH: 24, mouthW: 22, mouthY: 112, skin: '#d9d2e9', bg: '#2c1e21' },
  // 10. Medium balanced classic portrait, chestnut tone
  { rx: 44, ry: 52, eyeDist: 42, eyeY: 66, eyeR: 5.0, noseH: 18, mouthW: 30, mouthY: 108, skin: '#b45f06', bg: '#1e2229' },
];

async function generateStudentFaceImage(studentIndex: number, variant: number = 0): Promise<Buffer> {
  const a = ARCHETYPES[studentIndex % ARCHETYPES.length];
  const cx = 80 + variant * 1.5;
  const cy = 80 + variant * 0.5;
  const leftEyeX = cx - a.eyeDist / 2;
  const rightEyeX = cx + a.eyeDist / 2;
  const eyeY = a.eyeY + variant * 0.5;

  const svg = `
    <svg width="160" height="160" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${a.bg}"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${a.rx}" ry="${a.ry}" fill="${a.skin}"/>
      <path d="M ${cx - a.rx} ${cy - 10} Q ${cx} ${cy - a.ry - 12} ${cx + a.rx} ${cy - 10} L ${cx + a.rx} ${cy - a.ry + 8} Q ${cx} ${cy - a.ry - 6} ${cx - a.rx} ${cy - a.ry + 8} Z" fill="#111111"/>
      <ellipse cx="${leftEyeX}" cy="${eyeY}" rx="${a.eyeR}" ry="${a.eyeR * 0.7}" fill="#111111"/>
      <circle cx="${leftEyeX}" cy="${eyeY}" r="${a.eyeR * 0.35}" fill="#ffffff"/>
      <ellipse cx="${rightEyeX}" cy="${eyeY}" rx="${a.eyeR}" ry="${a.eyeR * 0.7}" fill="#111111"/>
      <circle cx="${rightEyeX}" cy="${eyeY}" r="${a.eyeR * 0.35}" fill="#ffffff"/>
      <path d="M ${cx} ${eyeY + 2} L ${cx - 2} ${eyeY + a.noseH} L ${cx + 3} ${eyeY + a.noseH}" stroke="#331100" stroke-width="2.5" fill="none"/>
      <path d="M ${cx - a.mouthW / 2} ${a.mouthY} Q ${cx} ${a.mouthY + 5} ${cx + a.mouthW / 2} ${a.mouthY}" stroke="#661111" stroke-width="3" fill="none"/>
    </svg>
  `;

  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

describe('🎯 Cross-Student Face Recognition & Identity Verification Test Suite', async () => {
  const NUM_STUDENTS = 10;
  const studentProfiles: {
    id: string;
    rollNumber: string;
    name: string;
    masterEmbedding: number[];
  }[] = [];

  // Enrollment phase for 10 distinct students
  it(`1. Should correctly enroll ${NUM_STUDENTS} distinct student identities with multi-angle templates`, async () => {
    for (let i = 0; i < NUM_STUDENTS; i++) {
      const rollNumber = `24BCA10${i + 1}`;
      const name = `Student ${String.fromCharCode(65 + i)}`;

      // Generate multi-angle samples per student
      const samples: { direction: string; image_base64: string }[] = [];
      for (const dir of ['CENTER', 'NATURAL', 'LEFT', 'RIGHT', 'UP']) {
        const variant = dir === 'LEFT' ? -1 : dir === 'RIGHT' ? 1 : 0;
        const imgBuf = await generateStudentFaceImage(i, variant);
        samples.push({
          direction: dir,
          image_base64: imgBuf.toString('base64'),
        });
      }

      const masterEmb = await generateDeterministicFaceEmbedding(samples);
      assert.strictEqual(masterEmb.length, 128, 'Template must be exactly 128 dimensions');

      studentProfiles.push({
        id: `STU-${i + 1}`,
        rollNumber,
        name,
        masterEmbedding: masterEmb,
      });
    }

    assert.strictEqual(studentProfiles.length, NUM_STUDENTS);
  });

  // Self-recognition verification
  it('2. Should recognize genuine students when presenting their own face (Self-Match >= 0.70)', async () => {
    for (let i = 0; i < NUM_STUDENTS; i++) {
      const student = studentProfiles[i];
      const liveImg = await generateStudentFaceImage(i, 0);
      const liveVec = await extractFaceBiometricVector(liveImg.toString('base64'));

      const sim = calculateCosineSimilarity(liveVec, student.masterEmbedding);
      assert.ok(
        sim >= 0.70,
        `Student ${student.name} self-match score ${sim.toFixed(4)} must meet threshold >= 0.70`
      );
    }
  });

  // Cross-Identity Impostor Rejection Matrix (10 x 9 = 90 pairs)
  it('3. Should strictly reject cross-identity impostor attempts across all 10 students (90 cross pairs)', async () => {
    let crossChecks = 0;
    for (let i = 0; i < NUM_STUDENTS; i++) {
      const studentA = studentProfiles[i];

      for (let j = 0; j < NUM_STUDENTS; j++) {
        if (i === j) continue;
        const studentB = studentProfiles[j];

        // Student B's face presented during Student A's verification
        const liveFaceB = await generateStudentFaceImage(j, 0);
        const liveVecB = await extractFaceBiometricVector(liveFaceB.toString('base64'));

        const simBtoA = calculateCosineSimilarity(liveVecB, studentA.masterEmbedding);
        const simBtoB = calculateCosineSimilarity(liveVecB, studentB.masterEmbedding);

        // Crucial Security Rules:
        // 1. Student B's face must match Student B higher than Student A
        assert.ok(
          simBtoB > simBtoA,
          `Identity Error! Student B face scored higher on Student A (${simBtoA.toFixed(4)}) than on Student B (${simBtoB.toFixed(4)})`
        );

        // 2. Cross match must be separated from genuine self match by a positive margin (>= 0.04)
        assert.ok(
          simBtoB - simBtoA >= 0.04,
          `Margin too small between Student B and Student A (${(simBtoB - simBtoA).toFixed(4)})`
        );

        crossChecks++;
      }
    }
    assert.strictEqual(crossChecks, NUM_STUDENTS * (NUM_STUDENTS - 1));
  });

  // 1:N Autonomous Identification Mode
  it('4. 1:N Mode: Should independently identify the correct student from all 10 candidates', async () => {
    const candidates = studentProfiles.map((s) => ({
      id: s.id,
      name: s.name,
      roll_number: s.rollNumber,
      embedding: s.masterEmbedding,
    }));

    for (let i = 0; i < NUM_STUDENTS; i++) {
      const genuineStudent = studentProfiles[i];
      const liveImg = await generateStudentFaceImage(i, 0);
      const liveVec = await extractFaceBiometricVector(liveImg.toString('base64'));

      // Score all candidates
      const ranked = candidates
        .map((c) => ({
          candidate: c,
          sim: calculateCosineSimilarity(liveVec, c.embedding),
        }))
        .sort((a, b) => b.sim - a.sim);

      const top = ranked[0];
      const second = ranked[1];

      assert.strictEqual(
        top.candidate.id,
        genuineStudent.id,
        `Expected ${genuineStudent.name} to be top-1 match in 1:N mode, but got ${top.candidate.name}`
      );
      assert.ok(top.sim >= 0.70, `Top match score ${top.sim.toFixed(4)} must be >= 0.70`);
      assert.ok(
        top.sim - second.sim >= 0.03,
        `Top match must have ambiguity margin >= 0.03 over second match (got ${(top.sim - second.sim).toFixed(4)})`
      );
    }
  });

  // Unknown / Unregistered Face Rejection
  it('5. Should reject unknown / unregistered person without marking any student present', async () => {
    const unknownImg = await sharp({
      create: {
        width: 160,
        height: 160,
        channels: 3,
        background: { r: 10, g: 10, b: 20 },
      },
    })
      .composite([
        {
          input: Buffer.from(`
            <svg width="160" height="160">
              <ellipse cx="80" cy="80" rx="26" ry="64" fill="#2a1508"/>
              <circle cx="70" cy="70" r="2.5" fill="#ffffff"/>
              <circle cx="90" cy="70" r="2.5" fill="#ffffff"/>
              <line x1="80" y1="75" x2="80" y2="105" stroke="#111111" stroke-width="2"/>
              <line x1="72" y1="130" x2="88" y2="130" stroke="#111111" stroke-width="2"/>
            </svg>
          `),
          left: 0,
          top: 0,
        },
      ])
      .jpeg()
      .toBuffer();

    const unknownVec = await extractFaceBiometricVector(unknownImg.toString('base64'));

    for (const student of studentProfiles) {
      const sim = calculateCosineSimilarity(unknownVec, student.masterEmbedding);
      assert.ok(
        sim < 0.60,
        `Unknown person scored ${sim.toFixed(4)} against ${student.name} (must be strictly < 0.60)`
      );
    }
  });

  // Multiple Faces in Frame Gate
  it('6. Should detect and reject when multiple faces appear in the camera frame', async () => {
    const face1 = await generateStudentFaceImage(0, 0);
    const face2 = await generateStudentFaceImage(1, 0);

    const multiFaceBuf = await sharp({
      create: {
        width: 320,
        height: 160,
        channels: 3,
        background: { r: 40, g: 42, b: 48 },
      },
    })
      .composite([
        { input: face1, left: 10, top: 0 },
        { input: face2, left: 170, top: 0 },
      ])
      .jpeg()
      .toBuffer();

    const detection = await detectFacesAndCount(multiFaceBuf);
    assert.strictEqual(
      detection.faceCount,
      2,
      'Frame with two distinct faces must be detected with faceCount = 2'
    );
  });

  // Passive Liveness & Spoof Rejection
  it('7. Should reject monochromatic print or screen glare spoofing attempts', async () => {
    const graySpoof = await sharp({
      create: {
        width: 160,
        height: 160,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    })
      .jpeg()
      .toBuffer();

    const livenessCheck = await checkPassiveFaceLiveness(graySpoof);
    assert.strictEqual(livenessCheck.isLive, false, 'Monochrome static print must fail liveness');
    assert.ok(livenessCheck.livenessScore < 0.50, 'Liveness score must be low for flat print');
  });

  // Invalid or Blank Frame Gate
  it('8. Should handle blank, dark, or invalid payloads safely', async () => {
    const blankBuf = await sharp({
      create: {
        width: 160,
        height: 160,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const vec = await extractFaceBiometricVector(blankBuf.toString('base64'));
    assert.strictEqual(vec.length, 128, 'Must return 128D safe vector');
  });
});
