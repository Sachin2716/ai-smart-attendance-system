# 🎓 AI Smart Attendance Management System
**AI-Powered Smart Attendance Management System Featuring Real-Time Face Detection, Multi-Pose Facial Registration, Automatic Image Capture, Secure Authentication, and Institutional Governance**

---

## 🌟 Executive Overview
The **AI Smart Attendance Management System** (`ai-smart-attendance-system`) is an enterprise-grade full-stack biometric attendance platform tailored for universities, colleges, and educational institutions.

The platform eliminates manual roll-calls, paper rosters, and proxy attendance via real-time computer vision head-pose estimation, multi-view facial biometric registration, passive anti-spoofing liveness checks, and role-based access control (RBAC).

---

## 🎯 Key Capabilities & Highlights

1. **Real-Time Client-Side Head-Pose Detection**:
   - Accurately calculates **Yaw** (horizontal rotation) and **Pitch** (vertical tilt) in degrees directly on video canvas frames at 25+ FPS.
   - Requires zero external cloud latency or heavy runtime model downloads.

2. **Strict 700ms Automatic Biometric Capture**:
   - **Step 1 (Center)**: Student faces camera directly ($|\text{Yaw}| \le 8^\circ$, $|\text{Pitch}| \le 8^\circ$). Auto-captures after 700ms steady hold.
   - **Step 2 (Left)**: Student turns head left ($\text{Yaw} \le -10^\circ$). Auto-captures after 700ms steady hold.
   - **Step 3 (Right)**: Student turns head right ($\text{Yaw} \ge +10^\circ$). Auto-captures after 700ms steady hold.
   - **Step 4 (Up)**: Student tilts head upward ($\text{Pitch} \ge +10^\circ$). Auto-captures after 700ms steady hold.
   - **Step 5 (Verification)**: Gallery review of all 4 captured poses with one-click retake capability.
   - **Zero Button Press Required**: Capture triggers automatically once pose stays within the mathematically verified range for 700ms.

3. **Multi-View 128D Master Biometric Embedding**:
   - Aggregates multi-angle captures (Center, Left, Right, Up) through OpenCV SFace Deep ResNet and YuNet neural networks.
   - Synthesizes an omnidirectional 128D master feature vector normalized with L2 norm for robust cosine matching ($\ge 0.75$ threshold).

4. **Live Face Guide & Premium UI Animations**:
   - Deep cyber dark palette (`#09090B` background, `#18181B` cards, `#3B82F6` electric blue, `#22D3EE` cyan, `#22C55E` success green).
   - Flying brand logo intro gliding smoothly from center to the top-left navigation.
   - Dynamic oval reticle that pulses Red (`#EF4444`) outside pose limits and transitions to Vibrant Green (`#22C55E`) inside the acceptable window.
   - Real-time SVG circular countdown ring filling from $0\% \to 100\%$ during the 700ms hold.
   - Animated count-up statistical counters on dashboards.
   - Full support for `@media (prefers-reduced-motion: reduce)` accessibility.

5. **Institutional Governance & Three Role-Based Panels**:
   - **Admin Panel (`/admin/dashboard`)**: Central master authority for students, faculty, timetables, and audit records.
   - **Faculty Panel (`/faculty/dashboard`)**: Live attendance scanner with web camera face verification, manual roster fallback, and session locking.
   - **Student Panel (`/student/dashboard`)**: Weekly timetable, biometric identity card, and attendance statistics.

---

## 📐 Mathematical Head-Pose Conventions & Physical Limits

### Coordinate & Sign Conventions
The estimator operates in mirrored webcam coordinates (`transform: scaleX(-1)`) to provide intuitive interaction:

| Head Movement | Angle Metric | Mathematical Inequality | Physical Tracking Bounds |
| :--- | :--- | :--- | :--- |
| **Center / Straight** | Yaw & Pitch | $|\text{Yaw}| \le 8^\circ \land |\text{Pitch}| \le 8^\circ$ | Face centered within oval guide |
| **Turn Left** | Negative Yaw | $\text{Yaw} \le -10^\circ$ | $-45^\circ \le \text{Yaw} \le -10^\circ$ |
| **Turn Right** | Positive Yaw | $\text{Yaw} \ge +10^\circ$ | $+10^\circ \le \text{Yaw} \le +45^\circ$ |
| **Tilt Upward** | Positive Pitch | $\text{Pitch} \ge +10^\circ$ | $+10^\circ \le \text{Pitch} \le +40^\circ$ |

### Physical Limits vs. Infinity
While directional movement mathematically extends toward negative or positive infinity, physical camera visibility requires bounded inequalities:
- **Left Head Movement**: Bound between $-45^\circ$ and $-10^\circ$. Beyond $-45^\circ$, the contralateral eye and facial features are occluded.
- **Right Head Movement**: Bound between $+10^\circ$ and $+45^\circ$.
- **Upward Head Movement**: Bound between $+10^\circ$ and $+40^\circ$.
- **Angles too close to center** ($|\text{Yaw}| < 10^\circ$ or $|\text{Pitch}| < 10^\circ$) are strictly rejected during directional steps to prevent false positive captures.
- **Single Source of Truth**: All thresholds are centrally configured in [`src/lib/biometrics/pose-config.ts`](src/lib/biometrics/pose-config.ts).

---

## ⏱️ Strict Automatic Capture & Stability Rules

1. **Continuous 700ms Hold**:
   - When a valid pose enters the mathematical range and satisfies all quality checks, an internal high-resolution timestamp records `holdStartTime`.
   - The user must maintain the pose continuously for **700 milliseconds**.
   - A visual circular countdown progress ring fills from $0\% \to 100\%$.
2. **Instant Cancellation & Reset**:
   - If the head moves outside the acceptable range before 700ms has elapsed, the timer immediately cancels and resets to 0%.
   - The reticle border immediately turns Red (`#EF4444`).
3. **Automatic Snapshot**:
   - Upon completing 700ms, the system automatically captures a full-resolution mirrored snapshot.
   - Triggers an audio confirmation chime, white shutter flash animation, and animated checkmark overlay.
4. **Duplicate Prevention**:
   - Each pose step can only be captured once.
   - Moving between steps enforces a 600ms grace cooldown to allow the student to adjust their head position without accidental triggering.
5. **Developer Angle HUD**:
   - For testing and calibration, a developer toggle (`Dev Angle HUD`) displays live yaw and pitch degrees. Students see clean, distraction-free instructions.

---

## 🛡️ Biometric Security & Quality Gates

Every frame is validated against seven strict quality gates before a pose can be accepted:
1. **Single Face Only**: Rejects multiple faces in the frame.
2. **Framing & Boundary**: Face must be fully contained within the guide oval.
3. **Face Size Ratio**: Face area must occupy between $8\%$ and $70\%$ of the viewport.
4. **Illumination**: Mean brightness must be between 25 and 245 (rejects darkness and overexposed glare).
5. **Image Sharpness**: Laplacian gradient variance must meet minimum sharpness threshold to eliminate motion blur.
6. **Skin Chrominance Cluster**: Human skin YCbCr cluster density must exceed minimum threshold.
7. **Anti-Spoofing Note**: Head-pose detection confirms directional cooperation; it is paired with passive frequency-domain texture analysis in the backend.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)**, **TypeScript** (Strict Mode), **Tailwind CSS 4**, **Framer Motion** |
| **Biometric Vision Engine** | **Custom Canvas Pose Estimator**, **OpenCV SFace 128D Deep Neural Network**, **YuNet** |
| **UI Components** | **shadcn/ui**, **Lucide React**, **Recharts**, **Sonner** |
| **Backend & Microservices** | **Next.js Server Route Handlers**, **Python 3.13 FastAPI** microservice |
| **Database & ORM** | **Prisma ORM (v6.19)**, **SQLite** (Localhost) / **PostgreSQL** (Production) |
| **Authentication & Tokens** | **Jose** (Signed HS256 JWT in HTTP-Only Cookies), **Bcrypt.js** |
| **Testing Suite** | **Node.js Native Test Runner (`node:test`)** with **tsx** |

---

## 🚀 Installation & Localhost Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (Node v20+ recommended)
- **Python**: v3.10 to v3.13 (for the Python AI microservice)
- **Git**: Installed and configured

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/sachin-s-in/ai-smart-attendance-system.git
cd ai-smart-attendance-system
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(By default, `.env` is configured with `DATABASE_URL="file:./dev.db"` which runs with zero configuration).*

### Step 3: Initialize Database & Seed Baseline Records
```bash
# Push Prisma schema to SQLite database
npm run db:push

# Seed Admin, Faculty, and Academic Timetables
npm run db:seed
```

### Step 4: Run Automated Tests
```bash
npm test
```
*Executes all 30 automated unit and integration tests across 5 test suites (15 pose validation scenarios + 15 RBAC/session tests).*

### Step 5: Start the Python Biometric Microservice (Optional for Full AI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Step 6: Start Next.js Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 👥 Default Accounts

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@caias.edu.in` | `Admin@123` | Institutional Governance, Master Records, Department / Timetable Controls |
| **Faculty** | `faculty@caias.edu.in` | `Faculty@123` | BCA AIML B Attendance Sessions, Live Face Camera, Manual Override |
| **Student** | Registered via `/register` | *Passwordless* | Timetable, Real Attendance Rates, Audit Log |

---

## 🧪 Testing Suite Coverage

Running `npm test` executes the complete test suite:
- **`tests/pose_validation.test.ts`** (15 Scenarios):
  - Scenario 1: Center frontal pose passing ($0^\circ$).
  - Scenario 2: Slight left turn below threshold rejected ($-6^\circ$ vs $-10^\circ$).
  - Scenario 3: Valid left turn accepted ($-18^\circ$).
  - Scenario 4: Slight right turn below threshold rejected ($+6^\circ$ vs $+10^\circ$).
  - Scenario 5: Valid right turn accepted ($+22^\circ$).
  - Scenario 6: Upward tilt below threshold rejected ($+5^\circ$ vs $+10^\circ$).
  - Scenario 7: Valid upward tilt accepted ($+19^\circ$).
  - Scenario 8: Fast movement timer reset verification.
  - Scenario 9: Face out of bounds / tracking loss rejection.
  - Scenario 10: Underexposed and overexposed lighting rejection.
  - Scenario 11: Motion blur / low sharpness rejection.
  - Scenario 12: Multiple faces rejection.
  - Scenario 13: Cross-pose confusion prevention (Right pose cannot satisfy Left step).
  - Scenario 14: Physical limit bounds enforcement ($-55^\circ$ rejected).
  - Scenario 15: Configurable thresholds override verification.
- **`tests/system_workflows.test.ts`** (15 Scenarios):
  - Authentication, JWT signing, RBAC cross-role denial, master roster synchronization, duplicate roll number rejection, attendance policies, and percentage calculations.

---

## ☁️ Vercel Deployment Instructions

The Next.js application is structured for direct deployment on Vercel:

1. **Push to GitHub**:
   Ensure all changes are pushed to your GitHub repository:
   ```bash
   git push origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your `ai-smart-attendance-system` repository.
   - Framework Preset: **Next.js**.
   - Root Directory: `./`.

3. **Configure Environment Variables**:
   In the Vercel project settings, add:
   - `DATABASE_URL`: Hosted PostgreSQL connection string (e.g. Neon, Supabase, or AWS RDS).
     *Note: SQLite (`file:./dev.db`) is supported locally; Vercel serverless functions require a remote PostgreSQL or Accelerate database.*
   - `JWT_SECRET`: Secure 256-bit random cryptographic secret.
   - `FASTAPI_AI_URL`: Public endpoint of your hosted Python AI microservice (e.g., deployed on Render, Fly.io, or Railway).

4. **Deploy**:
   - Click **Deploy**. Vercel will execute `next build` and deploy to production.

---

## 🔒 Security & Privacy Considerations

- **Explicit Camera Permission**: Camera is requested only when student explicitly navigates to biometric registration or faculty initiates attendance.
- **No Public Biometrics**: Raw biometric images are never exposed via unauthenticated endpoints.
- **Institutional Domain Validation**: Student registration enforces institutional email addresses (`@caias.edu.in`).
- **Secrets Management**: No private keys or database passwords are committed to source control (`.gitignore` enforces exclusions).

---

## ⚠️ Known Limitations
1. **Mirrored Camera Calibration**: The client-side estimator operates on user-facing webcam coordinates. If a physical camera hardware driver performs hardware-level mirroring inversion, use the developer HUD to verify directional reading.
2. **Vercel SQLite Persistence**: Vercel executes serverless functions on ephemeral containers. For production multi-tenant deployments on Vercel, configure a hosted PostgreSQL database (such as Neon or Supabase) in `DATABASE_URL`.
3. **Face Angle Extremes**: Very high yaw angles ($> 45^\circ$) occlude nasal and ocular landmarks; the system intentionally bounds accepted angles between $10^\circ$ and $45^\circ$ to ensure biometric enrollment quality.

---

## 📄 License
This project is licensed under the MIT License for institutional and educational use.
