// src/presentation/contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompatibilityAdapter } from '../../application/adapters/CompatibilityAdapter';

export interface Student {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  grado: string;
  curso: string;
  active: boolean;
}

interface AuthContextType {
  // State
  currentUser: Student | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasVotedThisMonth: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkVoteStatus: () => Promise<void>;
  
  // Utils
  getUserFullName: () => string;
  getUserInfo: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVotedThisMonth, setHasVotedThisMonth] = useState(false);

  // Verificar usuario almacenado al cargar
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setCurrentUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // Verificar estado de voto cuando hay usuario
  useEffect(() => {
    if (currentUser) {
      checkVoteStatus();
    }
  }, [currentUser]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      const result = await CompatibilityAdapter.authenticateStudent(username, password);
      
      if (result.success && result.student) {
        const student = result.student as Student;
        setCurrentUser(student);
        storeUser(student);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Error de autenticación' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Error de conexión. Intenta nuevamente.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setHasVotedThisMonth(false);
    clearStoredUser();
  };

  const checkVoteStatus = async () => {
    if (!currentUser) return;
    
    try {
      const voted = await CompatibilityAdapter.hasVotedThisMonth(currentUser.username);
      setHasVotedThisMonth(voted);
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  const getUserFullName = () => {
    if (!currentUser) return '';
    return `${currentUser.nombre} ${currentUser.apellido}`;
  };

  const getUserInfo = () => {
    if (!currentUser) return '';
    return `${currentUser.grado} - ${currentUser.curso}`;
  };

  const value: AuthContextType = {
    // State
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    hasVotedThisMonth,
    
    // Actions
    login,
    logout,
    checkVoteStatus,
    
    // Utils
    getUserFullName,
    getUserInfo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Funciones de localStorage (compatibilidad)
function getStoredUser(): Student | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('current-student');
  if (!stored) return null;
  
  try {
    const { student, timestamp } = JSON.parse(stored);
    // Sesión válida por 8 horas
    if (Date.now() - timestamp < 8 * 60 * 60 * 1000) {
      return student;
    } else {
      localStorage.removeItem('current-student');
      return null;
    }
  } catch {
    return null;
  }
}

function storeUser(student: Student) {
  localStorage.setItem('current-student', JSON.stringify({
    student,
    timestamp: Date.now()
  }));
}

function clearStoredUser() {
  localStorage.removeItem('current-student');
}