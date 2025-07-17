// src/presentation/components/voting/CandidateCard.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vote, User, Loader2 } from 'lucide-react';
import { Candidate } from '../../contexts/VotingContext';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected?: boolean;
  onSelect?: (candidateId: string) => void;
  onVote?: (candidateId: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
  showVoteButton?: boolean;
  voteCount?: number;
  percentage?: number;
  className?: string;
}

export function CandidateCard({
  candidate,
  isSelected = false,
  onSelect,
  onVote,
  disabled = false,
  showVoteButton = false,
  voteCount,
  percentage,
  className = ''
}: CandidateCardProps) {
  const [voting, setVoting] = useState(false);

  const handleSelect = () => {
    if (!disabled && onSelect) {
      onSelect(candidate.id);
    }
  };

  const handleVote = async () => {
    if (!onVote || voting || disabled) return;
    
    setVoting(true);
    try {
      const result = await onVote(candidate.id);
      if (result.success) {
        // Success feedback could be handled by parent component
      }
    } finally {
      setVoting(false);
    }
  };

  return (
    <Card 
      className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={handleSelect}
    >
      <CardContent className="p-6">
        <div className="text-center">
          {/* Avatar placeholder */}
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>

          {/* Name and info */}
          <h3 className="text-lg font-semibold text-gray-900">
            {candidate.nombre} {candidate.apellido}
          </h3>
          
          <div className="flex justify-center gap-2 mt-2 mb-4">
            <Badge variant="secondary">{candidate.grado}</Badge>
            <Badge variant="outline">{candidate.curso}</Badge>
          </div>

          {/* Vote count and percentage (for results view) */}
          {(voteCount !== undefined || percentage !== undefined) && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              {voteCount !== undefined && (
                <p className="text-2xl font-bold text-gray-900">{voteCount}</p>
              )}
              {percentage !== undefined && (
                <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
              )}
            </div>
          )}

          {/* Vote button */}
          {showVoteButton && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleVote();
              }}
              disabled={disabled || voting}
              className="w-full"
              size="sm"
            >
              {voting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Votando...
                </>
              ) : (
                <>
                  <Vote className="w-4 h-4 mr-2" />
                  Votar
                </>
              )}
            </Button>
          )}

          {/* Selection indicator */}
          {isSelected && !showVoteButton && (
            <div className="mt-3 flex items-center justify-center text-blue-600">
              <Vote className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Seleccionado</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// src/presentation/components/voting/CandidateList.tsx
import { Candidate } from '../../contexts/VotingContext';
import { CandidateCard } from './CandidateCard';
import { EmptyState } from '../shared/SharedComponents';

interface CandidateListProps {
  candidates: Candidate[];
  selectedCandidateId?: string;
  onCandidateSelect?: (candidateId: string) => void;
  onVote?: (candidateId: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
  showVoteButtons?: boolean;
  votes?: Record<string, number>;
  className?: string;
}

export function CandidateList({
  candidates,
  selectedCandidateId,
  onCandidateSelect,
  onVote,
  disabled = false,
  showVoteButtons = false,
  votes,
  className = ''
}: CandidateListProps) {
  if (candidates.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="No hay candidatos"
        description="No se encontraron candidatos con los filtros aplicados"
        className={className}
      />
    );
  }

  const totalVotes = votes ? Object.values(votes).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {candidates.map((candidate) => {
        const voteCount = votes ? votes[candidate.id] || 0 : undefined;
        const percentage = votes && totalVotes > 0 ? (voteCount! / totalVotes) * 100 : undefined;

        return (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            isSelected={selectedCandidateId === candidate.id}
            onSelect={onCandidateSelect}
            onVote={onVote}
            disabled={disabled}
            showVoteButton={showVoteButtons}
            voteCount={voteCount}
            percentage={percentage}
          />
        );
      })}
    </div>
  );
}

// src/presentation/components/voting/FilterPanel.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { GRADOS, CURSOS } from '../../contexts/VotingContext';

interface FilterPanelProps {
  selectedGrado: string;
  selectedCurso: string;
  onGradoChange: (grado: string) => void;
  onCursoChange: (curso: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function FilterPanel({
  selectedGrado,
  selectedCurso,
  onGradoChange,
  onCursoChange,
  onClearFilters,
  hasActiveFilters,
  className = ''
}: FilterPanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Grado:</label>
          <Select value={selectedGrado} onValueChange={onGradoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los grados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los grados</SelectItem>
              {GRADOS.map((grado) => (
                <SelectItem key={grado} value={grado}>
                  {grado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Curso:</label>
          <Select value={selectedCurso} onValueChange={onCursoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los cursos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los cursos</SelectItem>
              {CURSOS.map((curso) => (
                <SelectItem key={curso} value={curso}>
                  {curso}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// src/presentation/components/voting/VoteConfirmation.tsx
import { CheckCircle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Candidate } from '../../contexts/VotingContext';

interface VoteConfirmationProps {
  candidate: Candidate;
  onViewResults?: () => void;
  onNewVote?: () => void; // For demo mode
  className?: string;
}

export function VoteConfirmation({
  candidate,
  onViewResults,
  onNewVote,
  className = ''
}: VoteConfirmationProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700 flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            ¡Voto Registrado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-green-700">
            Tu voto por <strong>{candidate.nombre} {candidate.apellido}</strong> ha sido registrado exitosamente.
          </p>
          
          <p className="text-sm text-green-600">
            ¡Gracias por participar en la Bandera de la Empatía!
          </p>

          <div className="flex gap-2 pt-4">
            {onViewResults && (
              <Button onClick={onViewResults} className="flex-1">
                Ver Resultados
              </Button>
            )}
            {onNewVote && (
              <Button onClick={onNewVote} variant="outline" className="flex-1">
                Nuevo Voto
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}