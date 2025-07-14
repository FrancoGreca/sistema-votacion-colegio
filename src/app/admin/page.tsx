'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, BarChart3, Trash2, Users, Vote, UserPlus, Download, Crown } from "lucide-react"
import { getCandidates, getVotes } from '../../lib/auth'

const ADMIN_PASSWORD = "colegio2024"
const USE_AUTH = process.env.NEXT_PUBLIC_USE_AUTH === 'true'

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

// Función para formatear el mes correctamente para Airtable
const formatMonthForAirtable = (date: Date): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  
  return months[date.getMonth()]
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'candidates'>('stats')

  // Estados para agregar estudiante
  const [newStudent, setNewStudent] = useState({
    username: '',
    password: '123',
    nombre: '',
    apellido: '',
    grado: '1ro',
    curso: 'Arrayan'
  })

  // Estados para agregar candidato
  const [newCandidate, setNewCandidate] = useState({
    nombre: '',
    apellido: '',
    grado: '1ro',
    curso: 'Arrayan'
  })

  const loadVotes = useCallback(async () => {
    try {
      const currentMonth = formatMonthForAirtable(new Date())
      const currentYear = new Date().getFullYear().toString()
      const votesData = await getVotes(currentMonth, currentYear)
      setVotes(votesData)
    } catch (error) {
      console.error('Error loading votes:', error)
    }
  }, [])

  const loadCandidates = useCallback(async () => {
    try {
      const candidatesData = await getCandidates()
      setCandidates(candidatesData)
    } catch (error) {
      console.error('Error loading candidates:', error)
    }
  }, [])

  const loadStudents = useCallback(async () => {
    if (!USE_AUTH) return

    try {
      // Usar endpoint API en lugar de llamada directa
      const response = await fetch('/api/students')
      if (response.ok) {
        const studentsData = await response.json()
        setStudents(studentsData)
      } else {
        console.error('Error loading students via API')
        setStudents([]) // Fallback a array vacío
      }
    } catch (error) {
      console.error('Error loading students:', error)
      setStudents([]) // Fallback a array vacío
    }
  }, [])

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem('admin-authenticated') === 'true'
      setAuthenticated(isAuth)
      setLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (authenticated) {
      loadVotes()
      loadCandidates()
      loadStudents()
    }
  }, [authenticated, loadVotes, loadCandidates, loadStudents])

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      localStorage.setItem('admin-authenticated', 'true')
    } else {
      alert('Contraseña incorrecta')
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    localStorage.removeItem('admin-authenticated')
    setPassword("")
  }

  const clearVotes = async () => {
    if (!confirm('¿Estás seguro de eliminar todos los votos del mes actual?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/clear-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setVotes({})
        alert('Votos eliminados exitosamente')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error clearing votes:', error)
      alert('Error al eliminar votos')
    }
  }

  const addStudent = async () => {
    if (!newStudent.username || !newStudent.nombre || !newStudent.apellido) {
      alert('Complete todos los campos obligatorios')
      return
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newStudent.username,
          password: newStudent.password,
          nombre: newStudent.nombre,
          apellido: newStudent.apellido,
          grado: newStudent.grado,
          curso: newStudent.curso
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNewStudent({
          username: '',
          password: '123',
          nombre: '',
          apellido: '',
          grado: '1ro',
          curso: 'Arrayan'
        })

        await loadStudents()
        alert('Estudiante agregado exitosamente')
      } else {
        alert(`Error al agregar estudiante: ${data.error}`)
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Error al agregar estudiante')
    }
  }

  const addCandidate = async () => {
    if (!newCandidate.nombre || !newCandidate.apellido) {
      alert('Complete nombre y apellido')
      return
    }

    try {
      console.log('Sending candidate data:', {
        nombre: newCandidate.nombre,
        apellido: newCandidate.apellido,
        grado: newCandidate.grado,
        curso: newCandidate.curso
      })

      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: newCandidate.nombre,
          apellido: newCandidate.apellido,
          grado: newCandidate.grado,
          curso: newCandidate.curso
        }),
      })

      console.log('Response status:', response.status, response.statusText)

      // Verificar si la respuesta es OK antes de parsear
      if (!response.ok) {
        const errorText = await response.text()
        console.log('HTTP Error response:', response.status, errorText)
        
        // Parsear el error para mostrar mensaje más amigable
        try {
          const errorData = JSON.parse(errorText)
          if (response.status === 409) {
            // Error de duplicado - esperado
            alert(`⚠️ ${errorData.error || 'El candidato ya existe'}`)
          } else {
            // Otros errores HTTP
            alert(`Error ${response.status}: ${errorData.error || 'Error del servidor'}`)
          }
        } catch {
          // Si no se puede parsear, mostrar error genérico
          alert(`Error HTTP ${response.status}: ${errorText}`)
        }
        return
      }

      // Leer la respuesta como texto primero para debugging
      const responseText = await response.text()
      console.log('Raw response:', responseText)

      // Verificar si hay contenido para parsear
      if (!responseText.trim()) {
        console.error('Empty response received')
        alert('Error: Respuesta vacía del servidor')
        return
      }

      let data
      try {
        data = JSON.parse(responseText)
        console.log('Parsed data:', data)
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError)
        console.error('Response text was:', responseText)
        alert('Error: Respuesta inválida del servidor')
        return
      }

      // Verificar si la operación fue exitosa
      if (data && data.success) {
        // Limpiar el formulario
        setNewCandidate({
          nombre: '',
          apellido: '',
          grado: '1ro',
          curso: 'Arrayan'
        })

        // Recargar la lista de candidatos
        await loadCandidates()
        alert('Candidato agregado exitosamente')
      } else {
        // Manejar errores de la API
        const errorMsg = data?.error || 'Error desconocido'
        console.error('API Error:', errorMsg)
        alert(`Error al agregar candidato: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Network error adding candidate:', error)
      alert('Error de conexión al agregar candidato')
    }
  }

  const exportData = () => {
    const data = {
      candidates,
      votes,
      students: USE_AUTH ? students : [],
      timestamp: new Date().toISOString(),
      month: formatMonthForAirtable(new Date()),
      year: new Date().getFullYear()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `votacion-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Panel de Administración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Contraseña de administrador:</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleLogin} className="w-full">
                Iniciar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>

        {/* Navegación de tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'stats' ? 'default' : 'outline'}
            onClick={() => setActiveTab('stats')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Estadísticas
          </Button>
          {USE_AUTH && (
            <Button
              variant={activeTab === 'students' ? 'default' : 'outline'}
              onClick={() => setActiveTab('students')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Estudiantes
            </Button>
          )}
          <Button
            variant={activeTab === 'candidates' ? 'default' : 'outline'}
            onClick={() => setActiveTab('candidates')}
            className="flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Candidatos
          </Button>
        </div>

        {/* Contenido de estadísticas */}
        {activeTab === 'stats' && (
          <>
            {/* Resumen */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Vote className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{totalVotes}</p>
                      <p className="text-gray-600">Votos Totales</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Crown className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold">{candidates.length}</p>
                      <p className="text-gray-600">Candidatos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {USE_AUTH && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Users className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{students.length}</p>
                        <p className="text-gray-600">Estudiantes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Acciones rápidas */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={clearVotes} variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Limpiar Votos del Mes
                  </Button>
                  <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exportar Datos
                  </Button>
                  <Button onClick={loadVotes} variant="outline">
                    Actualizar Datos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resultados */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Votación - {formatMonthForAirtable(new Date())} {new Date().getFullYear()}</CardTitle>
              </CardHeader>
              <CardContent>
                {totalVotes === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No hay votos registrados este mes</p>
                    <p className="text-sm text-gray-400">Los votos aparecerán aquí cuando los estudiantes empiecen a votar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidates
                      .filter(candidato => votes[candidato.id] > 0)
                      .sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))
                      .map((candidato, index) => (
                        <div key={candidato.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-50 text-blue-800'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{candidato.apellido}, {candidato.nombre}</p>
                              <p className="text-sm text-gray-600">{candidato.grado} {candidato.curso}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{votes[candidato.id]}</p>
                            <p className="text-sm text-gray-600">
                              {((votes[candidato.id] / totalVotes) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Contenido de estudiantes */}
        {activeTab === 'students' && USE_AUTH && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Agregar Nuevo Estudiante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Usuario:</label>
                    <Input
                      placeholder="nombre.apellido"
                      value={newStudent.username}
                      onChange={(e) => setNewStudent({...newStudent, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Contraseña:</label>
                    <Input
                      placeholder="123"
                      value={newStudent.password}
                      onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nombre:</label>
                    <Input
                      placeholder="Nombre"
                      value={newStudent.nombre}
                      onChange={(e) => setNewStudent({...newStudent, nombre: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Apellido:</label>
                    <Input
                      placeholder="Apellido"
                      value={newStudent.apellido}
                      onChange={(e) => setNewStudent({...newStudent, apellido: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Grado:</label>
                    <Select 
                      value={newStudent.grado} 
                      onValueChange={(value) => setNewStudent({...newStudent, grado: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1ro">1ro</SelectItem>
                        <SelectItem value="2do">2do</SelectItem>
                        <SelectItem value="3ro">3ro</SelectItem>
                        <SelectItem value="4to">4to</SelectItem>
                        <SelectItem value="5to">5to</SelectItem>
                        <SelectItem value="6to">6to</SelectItem>
                        <SelectItem value="7mo">7mo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Curso:</label>
                    <Select 
                      value={newStudent.curso} 
                      onValueChange={(value) => setNewStudent({...newStudent, curso: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arrayan">Arrayan</SelectItem>
                        <SelectItem value="Ceibo">Ceibo</SelectItem>
                        <SelectItem value="Jacarandá">Jacarandá</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={addStudent} className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar Estudiante
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Estudiantes Registrados ({students.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay estudiantes registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{student.apellido}, {student.nombre}</p>
                          <p className="text-sm text-gray-600">@{student.username} • {student.grado} {student.curso}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.active ? '✅ Activo' : '❌ Inactivo'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Contenido de candidatos */}
        {activeTab === 'candidates' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Agregar Nuevo Candidato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nombre:</label>
                    <Input
                      placeholder="Nombre"
                      value={newCandidate.nombre}
                      onChange={(e) => setNewCandidate({...newCandidate, nombre: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Apellido:</label>
                    <Input
                      placeholder="Apellido"
                      value={newCandidate.apellido}
                      onChange={(e) => setNewCandidate({...newCandidate, apellido: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Grado:</label>
                    <Select 
                      value={newCandidate.grado} 
                      onValueChange={(value) => setNewCandidate({...newCandidate, grado: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1ro">1ro</SelectItem>
                        <SelectItem value="2do">2do</SelectItem>
                        <SelectItem value="3ro">3ro</SelectItem>
                        <SelectItem value="4to">4to</SelectItem>
                        <SelectItem value="5to">5to</SelectItem>
                        <SelectItem value="6to">6to</SelectItem>
                        <SelectItem value="7mo">7mo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Curso:</label>
                    <Select 
                      value={newCandidate.curso} 
                      onValueChange={(value) => setNewCandidate({...newCandidate, curso: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arrayan">Arrayan</SelectItem>
                        <SelectItem value="Ceibo">Ceibo</SelectItem>
                        <SelectItem value="Jacarandá">Jacarandá</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={addCandidate} className="w-full">
                  <Crown className="w-4 h-4 mr-2" />
                  Agregar Candidato
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Candidatos Registrados ({candidates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay candidatos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {candidates.map((candidate) => (
                      <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{candidate.apellido}, {candidate.nombre}</p>
                          <p className="text-sm text-gray-600">{candidate.grado} {candidate.curso}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {votes[candidate.id] || 0} votos
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}