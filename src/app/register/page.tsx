'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  User,
  Mail,
  CreditCard,
  Phone,
  Lock,
  Building,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Camera,
  ShieldCheck,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { MultiAngleFaceEnrollment, DirectionalFrame } from '@/components/biometrics/MultiAngleFaceEnrollment';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { BrandLogoIntro } from '@/components/layout/BrandLogoIntro';
import Image from 'next/image';

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
  classSections: {
    id: string;
    fullLabel: string;
    semester: number;
    sectionName: string;
  }[];
}

export default function RegisterPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    phone: '',
    departmentId: '',
    semester: 3,
    classSectionId: '',
  });

  // Biometric frames
  const [biometricSamples, setBiometricSamples] = useState<DirectionalFrame[]>([]);

  // Catalogs
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Form UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load departments and class sections
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/public/academic-catalog');
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.departments || []);
          if (data.departments?.length > 0) {
            const firstDept = data.departments[0];
            const firstSection = firstDept.classSections?.[0];
            setFormData((prev) => ({
              ...prev,
              departmentId: prev.departmentId || firstDept.id,
              classSectionId: prev.classSectionId || (firstSection ? firstSection.id : ''),
              semester: firstSection ? firstSection.semester : 3,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load academic catalog:', err);
      } finally {
        setIsLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  const selectedDepartment = departments.find((d) => d.id === formData.departmentId);
  const availableSections = selectedDepartment?.classSections || [];

  const handleDeptChange = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    const firstSec = dept?.classSections?.[0];
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      classSectionId: firstSec ? firstSec.id : '',
      semester: firstSec ? firstSec.semester : 3,
    }));
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) return setError('Please enter your full legal name');
    if (!formData.rollNumber.trim()) return setError('Please enter your roll number / USN');
    if (!formData.email.trim()) return setError('Please enter your institutional email');
    if (!formData.email.endsWith('@caias.edu.in')) {
      return setError('Must use institutional email ending with @caias.edu.in');
    }
    if (!formData.departmentId) return setError('Please select your academic department');
    if (!formData.classSectionId) return setError('Please select your class section');

    setCurrentStep(2);
  };

  const handleBiometricsComplete = async (samples: DirectionalFrame[]) => {
    setBiometricSamples(samples);
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        departmentId: formData.departmentId,
        semester: Number(formData.semester),
        classSectionId: formData.classSectionId,
        biometricSamples: samples.map((s) => ({
          direction: s.direction,
          image_base64: s.image_base64,
          imageBase64: s.image_base64,
        })),
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Biometric enrollment failed. Please retry capture.');
      }

      setIsSuccess(true);
      setIsSubmitting(false);

      setTimeout(() => {
        router.push('/login?registered=1');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration could not be completed. Please try again.');
      setIsSubmitting(false);
      setCurrentStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F9FAFB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AnimatedBackground />
      <BrandLogoIntro />

      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#111318] border border-cyan-500/40 p-2 shadow-xl shadow-cyan-500/10 mb-4 ring-1 ring-cyan-500/20">
          <Image
            src="/logo.png"
            alt="AI Smart Attendance Logo"
            width={56}
            height={56}
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F9FAFB]">
          CAIAS Student Registration
        </h1>
        <p className="mt-2 text-xs text-[#9CA3AF]">
          Enter your academic details and complete your 4-pose automatic biometric face enrollment.
        </p>

        {/* Steps Breadcrumb */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
              currentStep === 1
                ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20 border border-blue-400'
                : 'bg-emerald-950/60 text-[#22C55E] border border-emerald-500/40'
            }`}
          >
            <span>1. Student Profile</span>
          </div>
          <div className="w-6 h-[1px] bg-[#27272A]" />
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
              currentStep === 2
                ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20 border border-blue-400'
                : 'bg-[#18181B] text-[#9CA3AF] border border-[#27272A]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>2. 4-Pose Biometrics</span>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#EF4444]" />
            <div>
              <p className="font-semibold text-rose-200">Registration Issue</p>
              <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {isSuccess ? (
          <div className="bg-[#18181B] border border-emerald-500/40 rounded-2xl p-8 text-center shadow-2xl shadow-emerald-500/10">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[#22C55E] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Registration Complete!</h2>
            <p className="text-xs text-[#9CA3AF] max-w-md mx-auto mb-6">
              Your 5-angle biometric facial profile has been generated and enrolled for automated AI attendance in section{' '}
              <span className="font-semibold text-cyan-400">{formData.rollNumber}</span>.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
              <Loader2 className="w-4 h-4 animate-spin text-[#22D3EE]" />
              <span>Redirecting to login portal in 2 seconds...</span>
            </div>
          </div>
        ) : isSubmitting ? (
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-12 text-center shadow-2xl">
            <Loader2 className="w-12 h-12 text-[#22D3EE] animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-white mb-2">
              Processing Biometric Multi-Angle Vector...
            </h3>
            <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
              OpenCV is performing face detection, Laplacian blur check, anti-spoof liveness verification, and 128D deep feature extraction across all 5 angles.
            </p>
          </div>
        ) : currentStep === 1 ? (
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-80" />

            <form onSubmit={handleStep1Submit} className="space-y-4">
              {/* Full Name & Roll Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#F9FAFB] mb-1.5">
                    Full Legal Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#111318] border border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F9FAFB] mb-1.5">
                    Roll Number / USN <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24BCA101"
                      value={formData.rollNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full bg-[#111318] border border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6] uppercase font-mono transition"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#F9FAFB] mb-1.5">
                    Institutional Email <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="name@caias.edu.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#111318] border border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6] transition"
                    />
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Must end with @caias.edu.in</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F9FAFB] mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#111318] border border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Department & Class Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#F9FAFB] mb-1.5">
                    Department <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={formData.departmentId}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      disabled={isLoadingCatalog}
                      className="w-full bg-[#111318] border border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6] transition"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F9FAFB] mb-1.5">
                    Class Section <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={formData.classSectionId}
                    onChange={(e) => {
                      const sec = availableSections.find((s) => s.id === e.target.value);
                      setFormData({
                        ...formData,
                        classSectionId: e.target.value,
                        semester: sec ? sec.semester : formData.semester,
                      });
                    }}
                    disabled={availableSections.length === 0}
                    className="w-full bg-[#111318] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6] transition"
                  >
                    {availableSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.fullLabel} (Sem {sec.semester})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Default Password Info Box */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-[#22D3EE] mt-0.5">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Default Account Access</h4>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    Your initial student login password is set to <span className="font-mono font-bold text-cyan-400">Student@123</span>. You can change this anytime from your student profile settings.
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.99] cursor-pointer"
                >
                  <span>Continue to 4-Pose Biometric Capture</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </button>
              </div>
            </form>

            <div className="mt-6 text-center border-t border-[#27272A] pt-4">
              <p className="text-xs text-[#9CA3AF]">
                Already registered?{' '}
                <Link
                  href="/login"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
                >
                  Sign in to your account
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Edit Student Details</span>
            </button>

            <MultiAngleFaceEnrollment
              onComplete={handleBiometricsComplete}
              onCancel={() => setCurrentStep(1)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
