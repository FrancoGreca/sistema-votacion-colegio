// src/presentation/contexts/VotingContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CompatibilityAdapter } from '../../application/adapters/CompatibilityAdapter';
import { useAuth } from './AuthContext';

export interface Candidate {
  id: string;
  nombre: string;
  apellido: string;
  grado: string;
  curso: string;
}

export interface VoteResult {
  candidate: Candidate;
  votes: number;
  percentage: number;
}

interface VotingContextType {
  // State
  candidates: Candidate[];
  filteredCandidates: Candidate[];
  votes: Record<string, number>;
  results: VoteResult[];
  
  // Filters
  selectedGrado: string;
  selectedCurso: string;
  selectedCandidate: string;
  
  // Loading states
  isLoadingCandidates: boolean;
  isLoadingVotes: boolean;
  isSubmitting: boolean;
  
  // Status
  hasVoted: boolean;
  error: string | null;
  
  // Actions
  loadCandidates: () => Promise<void>;
  loadVotes: (mes: string, ano: string) => Promise<void>;
  castVote: (candidateId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Filters
  setSelectedGrado: (grado: string) => void;
  setSelectedCurso: (curso: string) => void;
  setSelectedCandidate: (candidateId: string) => void;
  clearFilters: () => void;
  
  // Utils
  getTotalVotes: () => number;
  getWinner: () => VoteResult | null;
  getCandidateById: (id: string) => Candidate | undefined;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

const GRADOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"];
const CURSOS = ["Arrayan", "Jacarandá", "Ceibo"];

interface VotingProviderProps {
  children: ReactNode;
}

export function VotingProvider({ children }: VotingProviderProps) {
  const { currentUser, isAuthenticated } = useAuth();
  
  // State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [results, setResults] = useState<VoteResult[]>([]);
  
  // Filters
  const [selectedGrado, setSelectedGrado] = useState("");
  const [selectedCurso, setSelectedCurso] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  
  // Loading states
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Status
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load candidates
  const loadCandidates = useCallback(async () => {
    if (isLoadingCandidates) return;
    
    setIsLoadingCandidates(true);
    setError(null);
    
    try {
      const candidatesData = await CompatibilityAdapter.getCandidates();
      setCandidates(candidatesData);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Error al cargar candidatos');
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [isLoadingCandidates]);

  // Load votes
  const loadVotes = useCallback(async (mes: string, ano: string) => {
    if (isLoadingVotes) return;
    
    setIsLoadingVotes(true);
    setError(null);
    
    try {
      const votesData = await CompatibilityAdapter.getVotes(mes, ano);
      setVotes(votesData);
    } catch (err) {
      console.error('Error loading votes:', err);
      setError('Error al cargar votos');
    } finally {
      setIsLoadingVotes(false);
    }
  }, [isLoadingVotes]);

  // Cast vote
  const castVote = async (candidateId: string) => {
    if (!isAuthenticated || !currentUser) {
      return { success: false, error: 'Debes estar autenticado para votar' };
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const success = await CompatibilityAdapter.saveAuthenticatedVote(
        currentUser.username, 
        candidateId
      );
      
      if (success) {
        setHasVoted(true);
        // Reload current month votes
        const currentMonth = new Date().toLocaleString('es', { month: 'long' });
        const currentYear = new Date().getFullYear().toString();
        await loadVotes(currentMonth, currentYear);
        
        return { success: true };
      } else {
        return { success: false, error: 'Error al enviar el voto' };
      }
    } catch (err) {
      console.error('Vote error:', err);
      return { success: false, error: 'Error de conexión' };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter candidates when filters change
  useEffect(() => {
    let filtered = candidates;

    if (selectedGrado) {
      filtered = filtered.filter(c => c.grado === selectedGrado);
    }
    if (selectedCurso) {
      filtered = filtered.filter(c => c.curso === selectedCurso);
    }

    // Sort alphabetically by last name
    filtered.sort((a, b) => a.apellido.localeCompare(b.apellido, 'es'));

    setFilteredCandidates(filtered);
    
    // Clear selected candidate if it's not in filtered results
    if (selectedCandidate && !filtered.find(c => c.id === selectedCandidate)) {
      setSelectedCandidate("");
    }
  }, [candidates, selectedGrado, selectedCurso, selectedCandidate]);

  // Calculate results when votes or candidates change
  useEffect(() => {
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
    
    const resultsData: VoteResult[] = candidates.map(candidate => {
      const voteCount = votes[candidate.id] || 0;
      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
      
      return {
        candidate,
        votes: voteCount,
        percentage
      };
    });

    // Sort by votes descending
    resultsData.sort((a, b) => b.votes - a.votes);
    setResults(resultsData);
  }, [candidates, votes]);

  // Clear filters
  const clearFilters = () => {
    setSelectedGrado("");
    setSelectedCurso("");
    setSelectedCandidate("");
  };

  // Utils
  const getTotalVotes = () => {
    return Object.values(votes).reduce((sum, count) => sum + count, 0);
  };

  const getWinner = () => {
    return results.length > 0 ? results[0] : null;
  };

  const getCandidateById = (id: string) => {
    return candidates.find(c => c.id === id);
  };

  const value: VotingContextType = {
    // State
    candidates,
    filteredCandidates,
    votes,
    results,
    
    // Filters
    selectedGrado,
    selectedCurso,
    selectedCandidate,
    
    // Loading states
    isLoadingCandidates,
    isLoadingVotes,
    isSubmitting,
    
    // Status
    hasVoted,
    error,
    
    // Actions
    loadCandidates,
    loadVotes,
    castVote,
    
    // Filters
    setSelectedGrado,
    setSelectedCurso,
    setSelectedCandidate,
    clearFilters,
    
    // Utils
    getTotalVotes,
    getWinner,
    getCandidateById,
  };

  return (
    <VotingContext.Provider value={value}>
      {children}
    </VotingContext.Provider>
  );
}

export function useVoting() {
  const context = useContext(VotingContext);
  if (context === undefined) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
}

// Export constants for use in components
export { GRADOS, CURSOS };