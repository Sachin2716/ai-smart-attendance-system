'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FacultyUser, Department } from '@/types';
import { initialFaculty, hodFaculty } from '@/data/initialData';

export const adminUserMock: FacultyUser = {
  id: 'FAC-001',
  name: 'College Administrator',
  email: 'admin@caias.edu.in',
  employeeId: 'EMP-ADM-001',
  department: 'Computer Science',
  designation: 'Chief Administrator & Academic Officer',
  age: 45,
  gender: 'Male',
  mobile: '+91 98765 00000',
  subjectsHandled: ['ALL'],
  semesters: [1, 2, 3, 4, 5, 6, 7, 8],
  sections: ['A', 'B', 'C', 'D'],
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  isOnboarded: true,
};

export const facultyUserMock: FacultyUser = {
  ...initialFaculty,
  email: 'alan.turing@college.edu',
  role: 'Faculty',
};

interface AuthContextType {
  user: FacultyUser | null;
  isAdmin: boolean;
  isHod: boolean;
  isStudent: boolean;
  login: (email: string, pass?: string, role?: 'Admin' | 'Head of Dept' | 'Faculty' | 'Student', department?: Department) => boolean;
  logout: () => void;
  updateUserProfile: (updatedUser: FacultyUser) => void;
  canAccessTab: (tab: string) => boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FacultyUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem('smart_attendance_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch (e) {
        setUser(null);
      }
    } else {
      // Require Login upfront when opening link
      setUser(null);
    }
  }, []);

  const login = (
    email: string,
    pass?: string,
    explicitRole?: 'Admin' | 'Head of Dept' | 'Faculty' | 'Student',
    explicitDept?: Department
  ) => {
    let loggedInUser: FacultyUser;
    const cleanEmail = (email || '').trim().toLowerCase();

    const selectedDept: Department = explicitDept || 'Computer Science';
    const selectedRole = explicitRole || (
      cleanEmail.includes('admin') ? 'Admin' :
      (cleanEmail.includes('hod') || cleanEmail.includes('curie')) ? 'Head of Dept' :
      (cleanEmail.includes('sharma') || cleanEmail.includes('kumar') || cleanEmail.includes('verma') || cleanEmail.includes('student') || cleanEmail.includes('24bca')) ? 'Student' :
      'Faculty'
    );

    if (selectedRole === 'Admin') {
      loggedInUser = {
        ...adminUserMock,
        email: cleanEmail || adminUserMock.email,
        role: 'Admin',
      };
    } else if (selectedRole === 'Head of Dept') {
      loggedInUser = {
        ...hodFaculty,
        name: `Dr. HOD (${selectedDept})`,
        email: cleanEmail || `hod.${selectedDept.toLowerCase().replace(/\s+/g, '')}@caias.edu.in`,
        department: selectedDept,
        role: 'Head of Dept',
      };
    } else if (selectedRole === 'Student') {
      const isRegisteredStudent1 = cleanEmail.includes('aarav') || cleanEmail.includes('sharma') || cleanEmail.includes('001');
      const studentUSN = isRegisteredStudent1 ? '24BCA001' : cleanEmail.includes('002') || cleanEmail.includes('aditya') ? '24BCA002' : '24BCA003';
      const studentName = isRegisteredStudent1 ? 'Aarav Sharma' : cleanEmail.includes('002') || cleanEmail.includes('aditya') ? 'Aditya Kumar' : 'Rahul Verma';
      
      loggedInUser = {
        id: `STU-${studentUSN}`,
        name: studentName,
        email: cleanEmail || `${studentUSN.toLowerCase()}@caias.edu.in`,
        employeeId: studentUSN,
        student_id: studentUSN,
        department: selectedDept,
        designation: 'Student (BCA AI & ML)',
        age: 20,
        gender: 'Male',
        mobile: '+91 98765 43210',
        subjectsHandled: ['Python AI', 'DBMS', 'Computer Vision'],
        semesters: [3],
        sections: ['B'],
        class_label: 'BCA AIML 3B',
        role: 'Student',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isOnboarded: true,
        is_face_enrolled: isRegisteredStudent1, // Student 1 enrolled, Student 2 & 3 not enrolled
      };
    } else {
      loggedInUser = {
        ...facultyUserMock,
        name: `Dr. Alan Turing`,
        email: cleanEmail || facultyUserMock.email,
        department: selectedDept,
        role: 'Faculty',
      };
    }
    
    setUser(loggedInUser);
    localStorage.setItem('smart_attendance_user', JSON.stringify(loggedInUser));
    setIsLoginModalOpen(false);

    if (!loggedInUser.isOnboarded) {
      setIsOnboardingOpen(true);
    }

    return true;
  };

  const updateUserProfile = (updatedUser: FacultyUser) => {
    setUser(updatedUser);
    localStorage.setItem('smart_attendance_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smart_attendance_user');
  };

  const isAdmin = user?.role === 'Admin';
  const isHod = user?.role === 'Head of Dept';
  const isStudent = user?.role === 'Student';

  const canAccessTab = (tab: string): boolean => {
    if (isStudent) {
      // Students only have access to dashboard, history, settings, attendance
      const studentAllowedTabs = ['dashboard', 'history', 'settings', 'attendance'];
      return studentAllowedTabs.includes(tab);
    }

    if (isAdmin) {
      // Timetable Builder, Attendance Monitoring, Events, Auditorium, and Attendance History removed from Admin
      const adminBlockedTabs = ['timetable', 'attendance', 'events', 'auditorium', 'audit'];
      if (adminBlockedTabs.includes(tab)) {
        return false;
      }
      return true;
    }

    if (isHod) {
      // HOD Allowed: dashboard, classes, events, reports, settings
      const hodBlockedTabs = ['students', 'admin', 'timetable', 'attendance', 'auditorium', 'audit'];
      if (hodBlockedTabs.includes(tab)) {
        return false;
      }
      return true;
    }

    // Faculty Allowed: dashboard, timetable, attendance, reports, settings
    const facultyBlockedTabs = ['students', 'classes', 'admin', 'events', 'auditorium', 'audit'];
    if (facultyBlockedTabs.includes(tab)) {
      return false;
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isHod,
        isStudent,
        login,
        logout,
        updateUserProfile,
        canAccessTab,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
