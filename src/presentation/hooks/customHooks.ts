// src/presentation/hooks/useCandidates.ts
import { useState, useEffect, useCallback } from 'react';
import { CompatibilityAdapter } from '../../application/adapters/CompatibilityAdapter';
import { Candidate } from '../contexts/VotingContext';

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await CompatibilityAdapter.getCandidates();
      setCandidates(data);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Error al cargar candidatos');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const refreshCandidates = useCallback(() => {
    loadCandidates();
  }, [loadCandidates]);

  const getCandidateById = useCallback((id: string) => {
    return candidates.find(c => c.id === id);
  }, [candidates]);

  const filterCandidates = useCallback((grado?: string, curso?: string) => {
    let filtered = candidates;
    
    if (grado) {
      filtered = filtered.filter(c => c.grado === grado);
    }
    if (curso) {
      filtered = filtered.filter(c => c.curso === curso);
    }
    
    return filtered.sort((a, b) => a.apellido.localeCompare(b.apellido, 'es'));
  }, [candidates]);

  useEffect(() => {
    loadCandidates();
  }, []);

  return {
    candidates,
    loading,
    error,
    refreshCandidates,
    getCandidateById,
    filterCandidates,
  };
}

// src/presentation/hooks/useVotes.ts
import { useState, useCallback } from 'react';
import { CompatibilityAdapter } from '../../application/adapters/CompatibilityAdapter';

export function useVotes() {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVotes = useCallback(async (mes: string, ano: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await CompatibilityAdapter.getVotes(mes, ano);
      setVotes(data);
    } catch (err) {
      console.error('Error loading votes:', err);
      setError('Error al cargar votos');
    } finally {
      setLoading(false);
    }
  }, []);

  const getTotalVotes = useCallback(() => {
    return Object.values(votes).reduce((sum, count) => sum + count, 0);
  }, [votes]);

  const getVotesForCandidate = useCallback((candidateId: string) => {
    return votes[candidateId] || 0;
  }, [votes]);

  const getVotePercentage = useCallback((candidateId: string) => {
    const total = getTotalVotes();
    const candidateVotes = getVotesForCandidate(candidateId);
    return total > 0 ? (candidateVotes / total) * 100 : 0;
  }, [getTotalVotes, getVotesForCandidate]);

  return {
    votes,
    loading,
    error,
    loadVotes,
    getTotalVotes,
    getVotesForCandidate,
    getVotePercentage,
  };
}

// src/presentation/hooks/useVotingActions.ts
import { useState } from 'react';
import { CompatibilityAdapter } from '../../application/adapters/CompatibilityAdapter';
import { useAuth } from '../contexts/AuthContext';

export function useVotingActions() {
  const { currentUser, isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const castVote = async (candidateId: string) => {
    if (!isAuthenticated || !currentUser) {
      return { success: false, error: 'Debes estar autenticado para votar' };
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const success = await CompatibilityAdapter.saveAuthenticatedVote(
        currentUser.username, 
        candidateId
      );
      
      if (success) {
        return { success: true };
      } else {
        const errorMsg = 'Error al enviar el voto';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Vote error:', err);
      const errorMsg = 'Error de conexión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSubmitting(false);
    }
  };

  const checkIfVoted = async () => {
    if (!currentUser) return false;
    
    try {
      return await CompatibilityAdapter.hasVotedThisMonth(currentUser.username);
    } catch (err) {
      console.error('Error checking vote status:', err);
      return false;
    }
  };

  return {
    submitting,
    error,
    castVote,
    checkIfVoted,
  };
}

// src/presentation/hooks/useFilters.ts
import { useState, useCallback, useMemo } from 'react';

export interface FilterState {
  grado: string;
  curso: string;
  candidate: string;
}

const GRADOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"];
const CURSOS = ["Arrayan", "Jacarandá", "Ceibo"];

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>({
    grado: "",
    curso: "",
    candidate: ""
  });

  const setGrado = useCallback((grado: string) => {
    setFilters(prev => ({ ...prev, grado, candidate: "" }));
  }, []);

  const setCurso = useCallback((curso: string) => {
    setFilters(prev => ({ ...prev, curso, candidate: "" }));
  }, []);

  const setCandidate = useCallback((candidate: string) => {
    setFilters(prev => ({ ...prev, candidate }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ grado: "", curso: "", candidate: "" });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.grado !== "" || filters.curso !== "";
  }, [filters]);

  return {
    filters,
    setGrado,
    setCurso,
    setCandidate,
    clearFilters,
    hasActiveFilters,
    availableGrados: GRADOS,
    availableCursos: CURSOS,
  };
}

// src/presentation/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// src/presentation/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// src/presentation/hooks/useAsync.ts
import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}