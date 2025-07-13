"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Heart, Vote, CheckCircle, Users, Loader2, BarChart3 } from "lucide-react"

// Datos de ejemplo
const candidatos = [
  { id: "1", nombre: "Ana", apellido: "García", grado: "1ro", curso: "Arrayan" },
  { id: "2", nombre: "Luis", apellido: "Martín", grado: "1ro", curso: "Arrayan" },
  { id: "3", nombre: "Sofia", apellido: "López", grado: "1ro", curso: "Ceibo" },
  { id: "4", nombre: "Carlos", apellido: "Rodríguez", grado: "2do", curso: "Jacarandá" },
  { id: "5", nombre: "María", apellido: "Fernández", grado: "2do", curso: "Arrayan" },
  { id: "6", nombre: "Diego", apellido: "Álvarez", grado: "3ro", curso: "Ceibo" },
  { id: "7", nombre: "Valentina", apellido: "Silva", grado: "3ro", curso: "Jacarandá" },
  { id: "8", nombre: "Joaquín", apellido: "Morales", grado: "4to", curso: "Arrayan" },
  { id: "9", nombre: "Isabella", apellido: "Castro", grado: "4to", curso: "Ceibo" },
  { id: "10", nombre: "Mateo", apellido: "Vargas", grado: "5to", curso: "Jacarandá" },
]

const grados = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const cursos = ["Arrayan", "Jacarandá", "Ceibo"]

const getCurrentMonth = () => {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  return meses[new Date().getMonth()]
}

const getCurrentYear = () => new Date().getFullYear()

export default function VotingPage() {
  const [selectedGrado, setSelectedGrado] = useState<string>("")
  const [selectedCurso, setSelectedCurso] = useState<string>("")
  const [selectedCandidate, setSelectedCandidate] = useState<string>("")
  const [hasVoted, setHasVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filteredCandidates, setFilteredCandidates] = useState(candidatos)

  // Filtrar candidatos
  useEffect(() => {
    let filtered = candidatos

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
  }, [selectedGrado, selectedCurso])

  const handleVote = async () => {
    if (!selectedCandidate) return

    setSubmitting(true)
    
    // Simular envío de voto
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Guardar en localStorage para demo
    const votes = JSON.parse(localStorage.getItem('demo-votes') || '{}')
    votes[selectedCandidate] = (votes[selectedCandidate] || 0) + 1
    localStorage.setItem('demo-votes', JSON.stringify(votes))
    
    setHasVoted(true)
    setSubmitting(false)
  }

  const resetVote = () => {
    setHasVoted(false)
    setSelectedCandidate("")
    setSelectedGrado("")
    setSelectedCurso("")
  }

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
              Tu voto para la Bandera de la Empatía de {getCurrentMonth()} ha sido enviado exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                Gracias por participar en la votación mensual.
              </p>
              <p className="text-xs text-green-600 mt-2">
                Los resultados se publicarán al final del mes.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={resetVote} variant="outline" className="w-full">
                Votar Nuevamente
              </Button>
              <Button 
                onClick={() => window.location.href = '/resultados'} 
                variant="secondary" 
                className="w-full"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Resultados
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              Bandera de la Empatía
            </CardTitle>
            <CardDescription className="text-lg">
              Votación de {getCurrentMonth()} {getCurrentYear()}
              <span className="block text-orange-600 text-sm mt-1 font-medium">
                🎭 MODO DEMO - Datos de prueba
              </span>
            </CardDescription>
            <div className="mt-4">
              <Button 
                onClick={() => window.location.href = '/resultados'} 
                variant="outline"
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Resultados
              </Button>
            </div>
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
                Elige el grado y curso para ver los candidatos disponibles
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
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
                <Vote className="w-5 h-5" />
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
                      {candidatos.find(c => c.id === selectedCandidate)?.apellido},{" "}
                      {candidatos.find(c => c.id === selectedCandidate)?.nombre}
                    </span>
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    ¿Confirmas tu voto?
                  </p>
                </div>

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