// src/presentation/pages/VotingPage.tsx
'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, BarChart3, AlertCircle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useVoting } from '../contexts/VotingContext';
import { AuthGuard } from '../components/auth/AuthComponents';
import { UserProfile, VoteStatusIndicator } from '../components/auth/AuthComponents';
import { CandidateList, FilterPanel, VoteConfirmation } from '../components/voting/VotingComponents';
import { LoadingSpinner, ErrorMessage, PageHeader } from '../components/shared/SharedComponents';

export function VotingPage() {
  const router = useRouter();
  const { currentUser, hasVotedThisMonth } = useAuth();
  const {
    filteredCandidates,
    selectedCandidate,
    setSelectedCandidate,
    selectedGrado,
    selectedCurso,
    setSelectedGrado,
    setSelectedCurso,
    clearFilters,
    loadCandidates,
    castVote,
    isLoadingCandidates,
    isSubmitting,
    error: votingError
  } = useVoting();

  const [hasVoted, setHasVoted] = useState(false);
  const [votedCandidate, setVotedCandidate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load candidates on mount
  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleVote = async () => {
    if (!selectedCandidate) {
      setError('Debes seleccionar un candidato');
      return;
    }

    const result = await castVote(selectedCandidate);
    
    if (result.success) {
      setHasVoted(true);
      setVotedCandidate(filteredCandidates.find(c => c.id === selectedCandidate));
    } else {
      setError(result.error || 'Error al votar');
    }
  };

  const hasActiveFilters = selectedGrado !== "" || selectedCurso !== "";

  // Show vote confirmation
  if (hasVoted && votedCandidate) {
    return (
      <VoteConfirmation
        candidate={votedCandidate}
        onViewResults={() => router.push('/resultados')}
      />
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <PageHeader
          title="Bandera de la Empatía"
          description={`Votación ${new Date().toLocaleString('es', { month: 'long', year: 'numeric' })}`}
          actions={
            <Button variant="outline" onClick={() => router.push('/resultados')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Resultados
            </Button>
          }
        />

        <div className="max-w-7xl mx-auto p-6">
          {/* User Profile */}
          <div className="mb-6">
            <UserProfile showVoteStatus compact />
          </div>

          {/* Vote Status Check */}
          {hasVotedThisMonth && (
            <div className="mb-6">
              <VoteStatusIndicator />
            </div>
          )}

          {/* Main Content */}
          {!hasVotedThisMonth ? (
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <FilterPanel
                  selectedGrado={selectedGrado}
                  selectedCurso={selectedCurso}
                  onGradoChange={setSelectedGrado}
                  onCursoChange={setSelectedCurso}
                  onClearFilters={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>

              {/* Candidates and Voting */}
              <div className="lg:col-span-3 space-y-6">
                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Instrucciones de Votación
                    </CardTitle>
                    <CardDescription>
                      Selecciona un candidato y confirma tu voto. Solo puedes votar una vez por mes.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Error Display */}
                {(error || votingError) && (
                  <ErrorMessage
                    message={error || votingError || ''}
                    onRetry={() => {
                      setError(null);
                      loadCandidates();
                    }}
                  />
                )}

                {/* Loading State */}
                {isLoadingCandidates && (
                  <div className="py-12">
                    <LoadingSpinner size="lg" text="Cargando candidatos..." />
                  </div>
                )}

                {/* Candidates List */}
                {!isLoadingCandidates && (
                  <>
                    <CandidateList
                      candidates={filteredCandidates}
                      selectedCandidateId={selectedCandidate}
                      onCandidateSelect={setSelectedCandidate}
                      disabled={isSubmitting}
                    />

                    {/* Vote Button */}
                    {selectedCandidate && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-6 text-center">
                          <p className="mb-4 text-blue-800">
                            Has seleccionado: <strong>
                              {filteredCandidates.find(c => c.id === selectedCandidate)?.nombre}{' '}
                              {filteredCandidates.find(c => c.id === selectedCandidate)?.apellido}
                            </strong>
                          </p>
                          <Button
                            onClick={handleVote}
                            disabled={isSubmitting}
                            size="lg"
                            className="px-8"
                          >
                            {isSubmitting ? (
                              <>
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">Enviando voto...</span>
                              </>
                            ) : (
                              <>
                                <Heart className="w-5 h-5 mr-2 text-white" />
                                Confirmar Voto
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Already Voted - Show Results Link */
            <div className="text-center py-12">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-8">
                  <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ya votaste este mes</h3>
                  <p className="text-gray-600 mb-6">
                    Puedes ver los resultados actuales de la votación.
                  </p>
                  <Button onClick={() => router.push('/resultados')}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Ver Resultados
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

// src/presentation/pages/ResultsPage.tsx
'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, ArrowLeft, Users, Vote, Calendar, BarChart3 } from 'lucide-react';

import { useVoting } from '../contexts/VotingContext';
import { CandidateList } from '../components/voting/VotingComponents';
import { LoadingSpinner, ErrorMessage, PageHeader, StatCard } from '../components/shared/SharedComponents';

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const getCurrentMonth = () => new Date().toLocaleString('es', { month: 'long' });
const getCurrentYear = () => new Date().getFullYear();

export function ResultsPage() {
  const router = useRouter();
  const { 
    candidates, 
    votes, 
    results, 
    loadCandidates, 
    loadVotes,
    getTotalVotes,
    getWinner,
    isLoadingCandidates,
    isLoadingVotes,
    error
  } = useVoting();

  const [selectedMes, setSelectedMes] = useState(getCurrentMonth());
  const [selectedAno, setSelectedAno] = useState(getCurrentYear().toString());

  // Load data on mount and when filters change
  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    loadVotes(selectedMes, selectedAno);
  }, [selectedMes, selectedAno, loadVotes]);

  const totalVotes = getTotalVotes();
  const winner = getWinner();

  const loading = isLoadingCandidates || isLoadingVotes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <PageHeader
        title="Resultados de Votación"
        description={`Bandera de la Empatía - ${selectedMes} ${selectedAno}`}
        showBackButton
        onBack={() => router.push('/')}
        actions={
          <Button variant="outline" onClick={() => router.push('/admin')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Admin
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Period Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Período de Votación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mes:</label>
                <Select value={selectedMes} onValueChange={setSelectedMes}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((mes) => (
                      <SelectItem key={mes} value={mes}>
                        {mes.charAt(0).toUpperCase() + mes.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Año:</label>
                <Select value={selectedAno} onValueChange={setSelectedAno}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => {
              loadCandidates();
              loadVotes(selectedMes, selectedAno);
            }}
            className="mb-6"
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12">
            <LoadingSpinner size="lg" text="Cargando resultados..." />
          </div>
        )}

        {/* Results Content */}
        {!loading && (
          <>
            {/* Statistics Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <StatCard
                title="Total de Votos"
                value={totalVotes}
                icon={Vote}
                color="blue"
              />
              <StatCard
                title="Candidatos"
                value={candidates.length}
                icon={Users}
                color="green"
              />
              <StatCard
                title="Ganador Actual"
                value={winner ? `${winner.candidate.nombre} ${winner.candidate.apellido}` : 'N/A'}
                icon={Trophy}
                color="yellow"
              />
            </div>

            {/* Winner Highlight */}
            {winner && winner.votes > 0 && (
              <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Trophy className="w-6 h-6" />
                    Candidato Líder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-yellow-900">
                        {winner.candidate.nombre} {winner.candidate.apellido}
                      </h3>
                      <p className="text-yellow-700">
                        {winner.candidate.grado} - {winner.candidate.curso}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-900">{winner.votes}</p>
                      <p className="text-yellow-700">{winner.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <Progress value={winner.percentage} className="mt-4" />
                </CardContent>
              </Card>
            )}

            {/* Results List */}
            {results.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados Detallados</CardTitle>
                  <CardDescription>
                    Votos por candidato ordenados de mayor a menor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div 
                        key={result.candidate.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              {result.candidate.nombre} {result.candidate.apellido}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {result.candidate.grado} - {result.candidate.curso}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold">{result.votes}</p>
                          <p className="text-gray-600 text-sm">
                            {result.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay votos para este período
                  </h3>
                  <p className="text-gray-600">
                    Selecciona un período diferente o espera a que se registren votos.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}