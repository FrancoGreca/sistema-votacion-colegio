"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, ArrowLeft, Users, Vote, Calendar, Loader2, BarChart3 } from "lucide-react"
import { getCandidates, getVotes } from '../lib/auth'

const grados = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const cursos = ["Arrayan", "Jacarandá", "Ceibo"]
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const getCurrentMonth = () => meses[new Date().getMonth()]
const getCurrentYear = () => new Date().getFullYear()

interface Candidate {
  id: string
  nombre: string
  apellido: string
  grado: string
  curso: string
}

interface ResultData {
  candidate: Candidate
  votes: number
  percentage: number
}

const USE_AUTH = process.env.NEXT_PUBLIC_USE_AUTH === 'true'

export default function ResultsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [selectedGrado, setSelectedGrado] = useState("all")
  const [selectedCurso, setSelectedCurso] = useState("all")
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth())
  const [selectedAno, setSelectedAno] = useState(getCurrentYear().toString())
  const [results, setResults] = useState<ResultData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar candidatos
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const candidatesData = await getCandidates()
        setCandidates(candidatesData)
      } catch (error) {
        console.error('Error loading candidates:', error)
        setError('Error al cargar candidatos')
      }
    }
    
    loadCandidates()
  }, [])

  // Cargar votos cuando cambia mes/año
  useEffect(() => {
    const loadVotes = async () => {
      try {
        setLoading(true)
        const votesData = await getVotes(selectedMes, selectedAno)
        setVotes(votesData)
      } catch (error) {
        console.error('Error loading votes:', error)
        setError('Error al cargar votos')
      } finally {
        setLoading(false)
      }
    }
    
    loadVotes()
  }, [selectedMes, selectedAno])

  // Calcular resultados cuando cambian filtros
  useEffect(() => {
    let filteredCandidates = candidates

    if (selectedGrado && selectedGrado !== "all") {
      filteredCandidates = filteredCandidates.filter(c => c.grado === selectedGrado)
    }
    if (selectedCurso && selectedCurso !== "all") {
      filteredCandidates = filteredCandidates.filter(c => c.curso === selectedCurso)
    }

    const resultsData: ResultData[] = filteredCandidates.map(candidate => ({
      candidate,
      votes: votes[candidate.id] || 0,
      percentage: 0,
    }))

    // Calcular porcentajes
    const totalVotes = resultsData.reduce((sum, r) => sum + r.votes, 0)
    resultsData.forEach(r => {
      r.percentage = totalVotes > 0 ? (r.votes / totalVotes) * 100 : 0
    })

    // Ordenar alfabéticamente por apellido
    resultsData.sort((a, b) => 
      a.candidate.apellido.localeCompare(b.candidate.apellido, 'es')
    )

    setResults(resultsData)
  }, [candidates, votes, selectedGrado, selectedCurso])

  // Ganador (el más votado)
  const sortedByVotes = [...results].sort((a, b) => b.votes - a.votes)
  const winner = sortedByVotes[0]
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0)

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Resultados de Votación
                  {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                </CardTitle>
                <CardDescription>
                  Resultados de la votación Bandera de la Empatía - {selectedMes} {selectedAno}
                  {!USE_AUTH && (
                    <span className="block text-orange-600 text-sm mt-1 font-medium">
                      🎭 MODO DEMO - Datos de prueba
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => window.location.href = "/"} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Votar
                </Button>
                <Button onClick={() => window.location.href = "/admin"} variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Estadísticas */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Vote className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{totalVotes}</p>
                <p className="text-sm text-gray-600">Total de Votos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{results.length}</p>
                <p className="text-sm text-gray-600">Candidatos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-lg font-bold">
                  {winner ? `${winner.candidate.apellido}, ${winner.candidate.nombre}` : "Sin votos"}
                </p>
                <p className="text-sm text-gray-600">Ganador del Mes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Filtros de Resultados
            </CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Mes:</label>
                <Select value={selectedMes} onValueChange={setSelectedMes}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes} value={mes}>
                        {mes}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Año:</label>
                <Select value={selectedAno} onValueChange={setSelectedAno}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Grado:</label>
                <Select value={selectedGrado} onValueChange={setSelectedGrado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grados</SelectItem>
                    {grados.map((grado) => (
                      <SelectItem key={grado} value={grado}>
                        {grado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Curso:</label>
                <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los cursos</SelectItem>
                    {cursos.map((curso) => (
                      <SelectItem key={curso} value={curso}>
                        {curso}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Resultados Detallados */}
        <Card>
          <CardHeader>
            <CardTitle>
              Resultados Detallados - {selectedMes} {selectedAno}
            </CardTitle>
            <CardDescription>
              Mostrando resultados para {selectedGrado === "all" ? "todos los grados" : selectedGrado} -{" "}
              {selectedCurso === "all" ? "todos los cursos" : selectedCurso}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-gray-500">Cargando resultados...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No hay candidatos para mostrar</p>
                <p className="text-sm text-gray-400">
                  Ajusta los filtros para ver más resultados
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={result.candidate.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            sortedByVotes[0]?.candidate.id === result.candidate.id
                              ? "bg-yellow-100 text-yellow-800"
                              : sortedByVotes[1]?.candidate.id === result.candidate.id
                                ? "bg-gray-100 text-gray-800"
                                : sortedByVotes[2]?.candidate.id === result.candidate.id
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {result.candidate.apellido}, {result.candidate.nombre}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{result.candidate.grado}</Badge>
                            <Badge variant="secondary">{result.candidate.curso}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{result.votes}</p>
                        <p className="text-sm text-gray-600">{result.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={result.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}