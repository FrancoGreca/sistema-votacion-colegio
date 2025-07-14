"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Heart, Vote, CheckCircle, Users, Loader2, BarChart3, LogOut, AlertCircle } from "lucide-react"
import LoginForm from '../components/LoginForm'
import { 
  getStoredUser, 
  clearStoredUser, 
  getCandidates, 
  hasVotedThisMonth, 
  saveAuthenticatedVote 
} from '../lib/auth'

const getCurrentMonth = () => {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  return meses[new Date().getMonth()]
}

const getCurrentYear = () => new Date().getFullYear()

interface Student {
  id: string
  username: string
  nombre: string
  apellido: string
  grado: string
  curso: string
  active: boolean
}

interface Candidate {
  id: string
  nombre: string
  apellido: string
  grado: string
  curso: string
}

export default function VotingPage() {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [selectedGrado, setSelectedGrado] = useState<string>("")
  const [selectedCurso, setSelectedCurso] = useState<string>("")
  const [selectedCandidate, setSelectedCandidate] = useState<string>("")
  const [hasVoted, setHasVoted] = useState(false)
  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const grados = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
  const cursos = ["Arrayan", "Jacarandá", "Ceibo"]

  // Verificar usuario logueado
  useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser) {
      setCurrentStudent(storedUser)
    }
    setLoading(false)
  }, [])

  // Cargar candidatos cuando hay usuario
  useEffect(() => {
    if (currentStudent) {
      loadCandidates()
      checkVoteStatus()
    }
  }, [currentStudent])

  // Filtrar candidatos
  useEffect(() => {
    let filtered = candidates

    if (selectedGrado) {
      filtered = filtered.filter(c => c.grado === selectedGrado)
    }
    if (selectedCurso) {
      filtered = filtered.filter(c => c.curso === selectedCurso)
    }

    // Ordenar alfabéticamente por apellido
    filtered.sort((a, b) => a.apellido.localeCompare(b.apellido, 'es'))

    setFilteredCandidates(filtered)
    setSelectedCandidate("")
  }, [candidates, selectedGrado, selectedCurso])

  const loadCandidates = async () => {
    try {
      const candidatesData = await getCandidates()
      setCandidates(candidatesData)
    } catch (error) {
      console.error('Error loading candidates:', error)
      setError('Error al cargar candidatos')
    }
  }

  const checkVoteStatus = async () => {
    if (!currentStudent) return

    try {
      const voted = await hasVotedThisMonth(currentStudent.username)
      setAlreadyVoted(voted)
    } catch (error) {
      console.error('Error checking vote status:', error)
    }
  }

  const handleVote = async () => {
    if (!selectedCandidate || !currentStudent) return

    setSubmitting(true)
    
    try {
      const success = await saveAuthenticatedVote(currentStudent.username, selectedCandidate)
      
      if (success) {
        setHasVoted(true)
        setAlreadyVoted(true)
      } else {
        setError('Error al enviar el voto. Intenta nuevamente.')
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    clearStoredUser()
    setCurrentStudent(null)
    setHasVoted(false)
    setAlreadyVoted(false)
    setSelectedCandidate("")
    setSelectedGrado("")
    setSelectedCurso("")
  }

  const resetVote = () => {
    setHasVoted(false)
    setSelectedCandidate("")
    setSelectedGrado("")
    setSelectedCurso("")
    setError(null)
  }

  // Mostrar login si no hay usuario
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!currentStudent) {
    return <LoginForm onLoginSuccess={setCurrentStudent} />
  }

  // Si ya votó este mes
  if (alreadyVoted && !hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl text-orange-700">Ya Votaste Este Mes</CardTitle>
            <CardDescription className="text-orange-600">
              Hola {currentStudent.nombre}, ya emitiste tu voto para {getCurrentMonth()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-700 font-medium">
                Solo puedes votar una vez por mes.
              </p>
              <p className="text-xs text-orange-600 mt-2">
                Los resultados se actualizan en tiempo real.
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/resultados'} 
                className="w-full"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Resultados
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si acaba de votar
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">¡Voto Registrado!</CardTitle>
            <CardDescription className="text-green-600">
              Gracias {currentStudent.nombre}, tu voto para {getCurrentMonth()} ha sido registrado exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                Tu voto está seguro y ha sido contabilizado.
              </p>
              <p className="text-xs text-green-600 mt-2">
                Los resultados se actualizan en tiempo real.
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/resultados'} 
                className="w-full"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Resultados
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">
                  {currentStudent.nombre} {currentStudent.apellido}
                </span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
            
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              Bandera de la Empatía
            </CardTitle>
            <CardDescription className="text-lg">
              Votación de {getCurrentMonth()} {getCurrentYear()}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-gray-700 font-medium">
                Vota por el compañero que demostró más empatía este mes
              </p>
              <p className="text-sm text-gray-600">
                Solo puedes votar una vez por mes. Elige cuidadosamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="w-5 h-5" />
              Selecciona Grado y Curso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Grado:</label>
                <Select value={selectedGrado} onValueChange={setSelectedGrado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {grados.map((grado) => (
                      <SelectItem key={grado} value={grado}>
                        {grado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Curso:</label>
                <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso} value={curso}>
                        {curso}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidatos */}
        {selectedGrado && selectedCurso && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Candidatos - {selectedGrado} {selectedCurso}
              </CardTitle>
              <CardDescription>
                Selecciona un candidato para votar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay candidatos para esta selección</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCandidate === candidate.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedCandidate(candidate.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">
                            {candidate.apellido}, {candidate.nombre}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{candidate.grado}</Badge>
                            <Badge variant="secondary">{candidate.curso}</Badge>
                          </div>
                        </div>
                        {selectedCandidate === candidate.id && (
                          <CheckCircle className="w-6 h-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botón de Votar */}
        {selectedCandidate && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    Has seleccionado a:{" "}
                    <span className="font-bold">
                      {filteredCandidates.find(c => c.id === selectedCandidate)?.apellido},{" "}
                      {filteredCandidates.find(c => c.id === selectedCandidate)?.nombre}
                    </span>
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    ⚠️ Solo puedes votar una vez por mes. ¿Confirmas tu voto?
                  </p>
                </div>
                
                {error && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button 
                  onClick={handleVote} 
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando Voto...
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4 mr-2" />
                      Confirmar Voto
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}