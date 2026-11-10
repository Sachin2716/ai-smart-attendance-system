# AI Smart Attendance System — Complete Technology Inventory

A comprehensive catalog of all programming languages, frameworks, libraries, AI/CV models, databases, deployment services, and developer tools used to build and operate the AI Smart Attendance Management System.

---

## 1. Programming Languages

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **TypeScript** | 5.9.3 | Type-safe application development across full Next.js stack, API routes, and biometric engines | Active / Production |
| 2 | **Python** | 3.13.5 (Dev) / 3.11.9 (Prod) | Deep learning, OpenCV computer vision microservice, and numerical array computation | Active / Production |
| 3 | **JavaScript (ES2024 / Node.js)** | 24.18.0 | Node.js runtime scripts, Prisma dynamic configuration, and client-side web interactions | Active / Production |
| 4 | **SQL (PostgreSQL / SQLite Dialects)** | PostgreSQL 16+ / SQLite 3 | Relational database modeling, queries, indexed constraints, and cascading foreign-key rules | Active / Production |
| 5 | **HTML5** | HTML5 Standard | Web video canvas rendering, camera frame capture streams, and semantic UI markup | Active / Production |
| 6 | **CSS3** | CSS3 / PostCSS | Cyberpunk dark aesthetic, layout grids, animations, and responsive screen styling | Active / Production |

---

## 2. Frontend Technologies

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **Next.js** | 16.3.0 | Modern App Router framework providing server components, client components, and API routing | Active / Production |
| 2 | **React** | 19.2.8 | Core reactive UI component library and virtual DOM rendering engine | Active / Production |
| 3 | **React DOM** | 19.2.8 | DOM renderer for React web application components | Active / Production |
| 4 | **Tailwind CSS** | 4.3.3 | Utility-first CSS engine providing responsive and cybernetic dark theme styling | Active / Production |
| 5 | **@tailwindcss/postcss** | 4.3.3 | PostCSS plugin integration for compiling Tailwind CSS v4 stylesheets | Active / Production |
| 6 | **React Hook Form** | 7.91.0 | High-performance state management for form validation (login, student registration) | Active / Production |
| 7 | **@hookform/resolvers** | 6.0.1 | Standard validation resolvers bridging React Hook Form with Zod schemas | Active / Production |
| 8 | **Zod** | 4.6.7 | TypeScript-first schema definition and runtime input validation library | Active / Production |
| 9 | **clsx** | 2.1.1 | Utility for conditionally constructing `className` strings | Active / Production |
| 10 | **tailwind-merge** | 3.6.0 | Conflict-free utility for merging Tailwind CSS classes in reusable UI components | Active / Production |

---

## 3. Backend Technologies

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **Next.js Route Handlers (Node.js)** | 16.3.0 | Primary backend REST APIs managing auth, sessions, students, faculty, timetables, and audit logs | Active / Production |
| 2 | **FastAPI** | 0.143.0 | High-performance asynchronous Python web API framework for computer vision operations | Active / Production |
| 3 | **Starlette** | 1.8.0 | ASGI framework foundation underlying FastAPI request handling and middleware | Active / Production |
| 4 | **Uvicorn** | 0.54.0 | Lightning-fast ASGI web server implementation for executing Python FastAPI | Active / Production |
| 5 | **Pydantic** | 2.14.1 | Data validation and settings management using Python type annotations | Active / Production |
| 6 | **Pydantic Settings** | 2.15.0 | Environment variable parsing and type enforcement for FastAPI backend | Active / Production |
| 7 | **python-multipart** | 0.0.32 | Streaming multipart form-data parser for processing image payload uploads | Active / Production |
| 8 | **CORSMiddleware** | Built-in (Starlette) | Cross-Origin Resource Sharing control for secure frontend-to-backend communication | Active / Production |

---

## 4. AI & Machine Learning

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **YuNet ONNX Model** | `face_detection_yunet.onnx` | Pretrained Deep Neural Network for high-speed, light-weight edge face detection | Active / Production |
| 2 | **SFace ONNX Model** | `face_recognition_sface.onnx` | Pretrained ResNet Deep Face Recognition model outputting 128D normalized feature vectors | Active / Production |
| 3 | **Cosine Similarity Algorithm** | Mathematical Formula | Measures cosine angle between 128D feature vectors for identity verification (threshold $\ge 0.75$) | Active / Production |
| 4 | **L2 Normalization (`norm_L2`)** | OpenCV / NumPy | Normalizes multi-dimensional embeddings to unit length for scale-invariant distance comparison | Active / Production |
| 5 | **Multi-Angle Master Synthesizer** | Custom Algorithm | Averages and normalizes 4 distinct face poses into a single master identity template | Active / Production |
| 6 | **Serverless Biometric Fallback** | Custom TypeScript | High-entropy deterministic feature extractor enabling verification on serverless runtimes | Active / Production |

---

## 5. Computer Vision

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **OpenCV (cv2)** | 4.14.0.94 | Core computer vision engine for face detection, image transformation, and feature extraction | Active / Production |
| 2 | **cv2.FaceDetectorYN** | 4.14.0.94 | YuNet deep learning face detector API embedded inside OpenCV DNN module | Active / Production |
| 3 | **cv2.FaceRecognizerSF** | 4.14.0.94 | SFace deep learning face recognition API embedded inside OpenCV DNN module | Active / Production |
| 4 | **Haar Cascade Frontal Face** | `haarcascade_frontalface_default.xml` | Classical cascade classifier for frontal facial bounding-box verification | Active / Production |
| 5 | **Haar Cascade Profile Face** | `haarcascade_profileface.xml` | Cascade classifier for detecting lateral head positions (left & right views) | Active / Production |
| 6 | **Haar Cascade Eye Detector** | `haarcascade_eye.xml` | Cascade classifier for ocular landmark localization and alignment checks | Active / Production |
| 7 | **Laplacian Blur Variance** | `cv2.Laplacian` | Computes second-order spatial derivatives to detect image blurriness and prevent replay attacks | Active / Production |
| 8 | **Passive Liveness Analyzer** | Custom Algorithm | Luminance variance, histogram distribution, and dynamic range check to block screen/printed attacks | Active / Production |
| 9 | **Client-Side Head-Pose Estimator** | Custom Canvas Algorithm | Calculates real-time Yaw ($-45^\circ$ to $+45^\circ$) and Pitch ($+10^\circ$ to $+40^\circ$) on live camera frames | Active / Production |

---

## 6. Python Libraries

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **fastapi** | 0.143.0 | Web microservice framework for computer vision endpoints | Installed & Used |
| 2 | **uvicorn** | 0.54.0 | ASGI web server running FastAPI | Installed & Used |
| 3 | **numpy** | 2.5.4 | Multi-dimensional array processing for image decoding and vector math | Installed & Used |
| 4 | **opencv-python-headless** | 4.14.0.94 | Headless OpenCV distribution with DNN module (no GUI dependencies) | Installed & Used |
| 5 | **pydantic** | 2.14.1 | Schema validation and serialization for API payloads | Installed & Used |
| 6 | **pydantic-settings** | 2.15.0 | Type-safe application settings and environment parsing | Installed & Used |
| 7 | **sqlalchemy** | 2.1.4 | SQL toolkit and Object Relational Mapper for backend database operations | Installed & Used |
| 8 | **aiosqlite** | 0.22.1 | Asynchronous SQLite database driver for local development fallback | Installed & Used |
| 9 | **psycopg2-binary** | 2.9.10 | PostgreSQL database adapter for connecting to cloud PostgreSQL instances | Installed & Used |
| 10 | **pandas** | 3.0.6 | Data manipulation library for tabular attendance analytics | Installed & Used |
| 11 | **openpyxl** | 3.1.5 | Excel spreadsheet reading and writing engine | Installed & Used |
| 12 | **python-jose** | 3.5.0 | Cryptographic JSON Web Signature (JWS) and JWT implementation | Installed & Used |
| 13 | **cryptography** | 50.0.2 | Cryptographic primitives providing encryption, hashing, and token signing | Installed & Used |
| 14 | **passlib** | 1.7.4 | Password hashing framework supporting bcrypt algorithms | Installed & Used |
| 15 | **bcrypt** | 5.0.0 | Native bcrypt password hashing library | Installed & Used |
| 16 | **python-multipart** | 0.0.32 | Form-data and binary file upload parsing | Installed & Used |
| 17 | **email-validator** | 2.3.0 | Robust email address validation for institutional user accounts | Installed & Used |
| 18 | **httpx** | 0.28.1 | Next-generation asynchronous HTTP client for testing and external requests | Installed & Used |
| 19 | **pytest** | 9.1.1 | Python unit testing framework | Installed (Testing) |
| 20 | **python-dotenv** | 1.2.4 | Reads key-value pairs from `.env` files into environment variables | Installed & Used |

---

## 7. JavaScript / Node.js Libraries

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **next** | 16.3.0 | Next.js core framework | Installed & Used |
| 2 | **react** | 19.2.8 | React core library | Installed & Used |
| 3 | **react-dom** | 19.2.8 | React DOM bindings | Installed & Used |
| 4 | **@prisma/client** | 6.19.3 | Auto-generated type-safe database query client | Installed & Used |
| 5 | **prisma** | 6.19.3 | Prisma database CLI for schema generation and database pushes | Installed & Used |
| 6 | **jose** | 6.2.13 | Universal Edge-compatible JSON Web Token (JWT) signing and verification | Installed & Used |
| 7 | **bcryptjs** | 3.0.3 | Optimized pure JavaScript implementation of bcrypt password hashing | Installed & Used |
| 8 | **zod** | 4.6.7 | TypeScript runtime schema validation | Installed & Used |
| 9 | **react-hook-form** | 7.91.0 | Uncontrolled form state management with performance optimization | Installed & Used |
| 10 | **@hookform/resolvers** | 6.0.1 | Integration resolvers for React Hook Form and Zod | Installed & Used |
| 11 | **lucide-react** | 1.29.0 | Icon library providing sleek cybernetic UI icons | Installed & Used |
| 12 | **framer-motion** | 13.0.0 | Production-ready motion animation library for React | Installed & Used |
| 13 | **recharts** | 3.10.1 | Composable declarative SVG charting library for attendance metrics | Installed & Used |
| 14 | **sonner** | 2.0.8 | Opinionated toast notification library for status feedback | Installed & Used |
| 15 | **canvas-confetti** | 1.9.4 | Canvas celebration animations on successful attendance marking | Installed & Used |
| 16 | **jspdf** | 4.2.1 | Client-side and server-side PDF document generation library | Installed & Used |
| 17 | **jspdf-autotable** | 5.0.8 | Table generation plugin for jsPDF attendance reports | Installed & Used |
| 18 | **xlsx** | 0.18.5 | Spreadsheets parser and exporter (Excel `.xlsx` / `.csv`) | Installed & Used |
| 19 | **clsx** | 2.1.1 | Utility for constructing conditional className strings | Installed & Used |
| 20 | **tailwind-merge** | 3.6.0 | Utility for resolving conflicting Tailwind classes | Installed & Used |
| 21 | **tailwindcss** | 4.3.3 | Tailwind CSS v4 engine | Installed (Dev) |
| 22 | **@tailwindcss/postcss** | 4.3.3 | PostCSS plugin for Tailwind CSS v4 | Installed (Dev) |
| 23 | **typescript** | 5.9.3 | TypeScript compiler and language server | Installed (Dev) |
| 24 | **tsx** | 4.23.15 | TypeScript execute runtime for test runner and database seeding | Installed (Dev) |
| 25 | **eslint** | 9.39.5 | Pluggable JavaScript and TypeScript linting utility | Installed (Dev) |
| 26 | **eslint-config-next** | 16.3.0 | ESLint configuration preset specifically for Next.js | Installed (Dev) |

---

## 8. Database & Data Storage

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **PostgreSQL (Neon Serverless)** | PostgreSQL 16+ | Primary cloud production database hosting all academic and biometric records | Active / Production |
| 2 | **SQLite** | SQLite 3 (`dev.db`) | Local zero-config development database fallback | Active / Dev Mode |
| 3 | **Prisma ORM** | 6.19.3 | Type-safe Object-Relational Mapping, relational schemas, migrations, and transactions | Active / Production |
| 4 | **SQLAlchemy** | 2.1.4 | Asynchronous and synchronous SQL toolkit used in FastAPI Python microservice | Active / Production |
| 5 | **Prisma Schema (PostgreSQL)** | `schema.postgresql.prisma` | PostgreSQL schema defining Users, Students, Faculty, Courses, Timetables, FaceTemplates | Active / Production |
| 6 | **Prisma Schema (SQLite)** | `schema.prisma` | SQLite schema with identical models for local zero-dependency development | Active / Dev Mode |
| 7 | **Dynamic Prisma Switcher** | `scripts/prepare-prisma.js` | Auto-detects PostgreSQL vs SQLite connection strings during postinstall | Active / Production |
| 8 | **In-Database Vector Storage** | Relational `TEXT` / `JSON` | 128D biometric feature vectors stored directly in relational tables (no external S3 needed) | Active / Production |

---

## 9. Authentication & Security

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **JSON Web Tokens (JWT)** | `jose` 6.2.13 (Node) / `python-jose` 3.5.0 (Py) | Stateless authentication tokens signed using HS256 algorithm with 24-hour expiration | Active / Production |
| 2 | **HTTP-Only Cookies** | `caias_auth_token` | Secure cookie delivery preventing Cross-Site Scripting (XSS) token theft | Active / Production |
| 3 | **bcrypt Password Hashing** | `bcryptjs` 3.0.3 / `bcrypt` 5.0.0 | Salted password hashing algorithm (10 rounds) protecting institutional accounts | Active / Production |
| 4 | **Role-Based Access Control (RBAC)** | Custom Auth Guard | Three-tier permissions (`ADMIN`, `FACULTY`, `STUDENT`) enforced on all API routes | Active / Production |
| 5 | **Next.js Proxy Middleware** | `src/middleware.ts` / Next.js Proxy | Server-side route protection intercepting unauthenticated requests | Active / Production |
| 6 | **Anti-Spoofing Liveness Checks** | Laplacian & Dynamic Range | Passive computer vision liveness validation preventing printed/screen spoofing | Active / Production |
| 7 | **Cryptographic Audit Logging** | Prisma `AuditLog` Model | Immutable audit trail recording user actions, IP records, and biometric enrollments | Active / Production |

---

## 10. APIs & Functions

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **Next.js App Router API Handlers** | Next.js 16.3.0 | 29 active RESTful endpoints servicing authentication, catalog, attendance, and administrative actions | Active / Production |
| 2 | **FastAPI Computer Vision Endpoints** | FastAPI 0.143.0 | 10 specialized microservice endpoints executing OpenCV detection, extraction, and matching | Active / Production |
| 3 | `POST /api/auth/login` | Custom Function | Authenticates credentials with bcrypt and issues signed HTTP-only JWT session cookie | Active / Production |
| 4 | `POST /api/auth/register` | Custom Function | Self-enrolls student with multi-view biometric photos and generates 128D master embedding | Active / Production |
| 5 | `POST /api/ai/verify-face` | Custom Function | Verifies camera frames against enrolled student vectors using FastAPI or serverless fallback | Active / Production |
| 6 | `DELETE /api/admin/students/[id]` | Custom Function | Transactional cascading deletion removing student profiles, biometrics, attendance, and user records | Active / Production |
| 7 | `DELETE /api/admin/faculty/[id]` | Custom Function | Transactional cascading deletion removing faculty profiles, timetable slots, and assignments | Active / Production |
| 8 | `GET /api/public/academic-catalog` | Custom Function | Public endpoint serving academic departments, courses, and active class sections | Active / Production |
| 9 | `GET /api/reports/export` | Custom Function | Dynamic report generator streaming PDF, Excel, and CSV attendance logs | Active / Production |
| 10 | `generateDeterministicFaceEmbedding` | Custom Function | Deterministic high-entropy feature vector synthesizer for offline/serverless resilience | Active / Production |
| 11 | `calculateCosineSimilarity` | Custom Function | Mathematical cosine similarity evaluator computing metric between two 128D vectors | Active / Production |

---

## 11. Development Tools

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **Git** | 2.46.0 | Distributed version control system tracking codebase history and branching | Active / Dev Mode |
| 2 | **GitHub CLI (`gh`)** | 2.55.0 | Command-line tool managing GitHub authentication, repository metadata, and remotes | Active / Dev Mode |
| 3 | **npm** | 12.1.0 | Package manager for Node.js modules and dependencies | Active / Dev Mode |
| 4 | **pip** | 25.1.1 | Package installer for Python libraries and dependencies | Active / Dev Mode |
| 5 | **Python Virtual Environment (`venv`)** | Python 3.13 | Isolated execution sandbox for Python dependencies in `backend/venv` | Active / Dev Mode |
| 6 | **Node.js** | 24.18.0 | Server-side JavaScript runtime powering Next.js and build scripts | Active / Dev Mode |
| 7 | **PowerShell** | 7.x / 5.1 | Windows shell automation environment used for running build and deployment scripts | Active / Dev Mode |
| 8 | **Vercel CLI** | 65.14.0 | Command-line deployment management for Vercel production hosting | Active / Dev Mode |
| 9 | **Cloudflare Tunnel (`cloudflared`)** | 2026.8.2 | Secure tunneling daemon exposing local dev servers to public HTTPS URLs for testing | Active / Dev Mode |

---

## 12. Deployment & Hosting

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **Vercel** | Platform (Native Next.js) | Production cloud host for Next.js frontend, App Router, and serverless API handlers | Active / Production |
| 2 | **Neon PostgreSQL** | Cloud Serverless (AWS us-east-1) | Autoscaling serverless PostgreSQL database hosting college relational and biometric data | Active / Production |
| 3 | **Render** | Blueprint (`render.yaml`) | Containerized cloud host specification for persistent Python FastAPI AI microservice | Configured / Ready |
| 4 | **GitHub** | Cloud Git Repository | Remote source code repository (`Sachin2716/ai-smart-attendance-system`) | Active / Production |
| 5 | **Cloudflare** | Quick Tunnel (`trycloudflare.com`) | Ephemeral public SSL tunnel for remote hardware and mobile camera testing | Active / Dev Mode |

---

## 13. Testing Tools

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **Node.js Native Test Runner (`--test`)** | Node.js 24.18.0 | High-performance built-in test runner executing unit and integration test suites | Active / Used |
| 2 | **tsx** | 4.23.15 | Executes TypeScript test files directly without prior manual compilation | Active / Used |
| 3 | **pytest** | 9.1.1 | Python testing framework for validating FastAPI routes and OpenCV face algorithms | Active / Used |
| 4 | **tests/pose_validation.test.ts** | Custom Suite | 15 unit tests verifying mathematical head-pose thresholds (Yaw/Pitch) | Active / Used (100% Pass) |
| 5 | **tests/system_workflows.test.ts** | Custom Suite | 15 integration tests validating student registration, facial verification, and RBAC | Active / Used (100% Pass) |
| 6 | **backend/tests/test_attendance.py** | Custom Suite | Unit tests for FastAPI session creation, face matching, and attendance marking | Active / Used |

---

## 14. UI/UX & Animation

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **Lucide React Icons** | 1.29.0 | Iconography library providing icons across admin, faculty, and student portals | Active / Production |
| 2 | **Framer Motion** | 13.0.0 | Declarative physics-based animations for cards, dialogs, scanning lines, and brand logo | Active / Production |
| 3 | **Recharts** | 3.10.1 | Responsive SVG charting components (Attendance AreaCharts, BarCharts, and PieCharts) | Active / Production |
| 4 | **Sonner** | 2.0.8 | Dark-themed toast notification system with progress and success states | Active / Production |
| 5 | **Canvas Confetti** | 1.9.4 | Canvas particle explosion celebration triggered upon verified face match | Active / Production |
| 6 | **Face Scanning Reticle Guide** | Custom SVG / CSS | Dynamic circular and oval reticle with real-time green/red state transitions | Active / Production |
| 7 | **700ms Countdown Progress Ring** | Custom SVG Stroke Dasharray | Real-time circular SVG ring filling during steady pose detection | Active / Production |
| 8 | **Cyberpunk Dark Palette** | Custom Design System | Black (`#09090B`), cards (`#18181B`), electric blue (`#3B82F6`), cyan (`#22D3EE`) | Active / Production |

---

## 15. Other Technologies

| No. | Technology / Tool / Library | Version | Purpose | Status |
|:---|:---|:---|:---|:---|
| 1 | **WebRTC / MediaDevices API** | Browser Native | Browser API (`navigator.mediaDevices.getUserMedia`) accessing webcam streams | Active / Production |
| 2 | **HTML5 Canvas 2D Context** | Browser Native | Captures raw video frames and converts them to base64 DataURIs for transmission | Active / Production |
| 3 | **Node.js System CA (`--use-system-ca`)** | Node.js 24 | Allows Node.js to use Windows system root certificate store for TLS requests | Active / Production |
| 4 | **TextEncoder / TextDecoder API** | Web Standard | Encodes cryptographic secrets into UTF-8 byte arrays for HMAC-SHA256 signing | Active / Production |
| 5 | **AbortController API** | Web Standard | Implements request timeouts for microservice communication | Active / Production |
| 6 | **UUID v4 Generator** | Web Crypto / Prisma | Generates unique 128-bit identifiers for all database entities | Active / Production |
| 7 | **OpenAPI / Swagger UI** | OpenAPI 3.1.0 | Auto-generated interactive API documentation served at `/docs` by FastAPI | Active / Production |
