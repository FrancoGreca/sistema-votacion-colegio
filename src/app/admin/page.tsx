'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, BarChart3, Trash2, Users, Vote, UserPlus, Download } from "lucide-react"
import { getCandidates, getVotes } from '../lib/auth'

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

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID

const airtableRequest = async (table: string, method = 'GET', body?: any) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Airtable error: ${response.status}`)
  }
  
  return response.json()
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

  useEffect(() => {
    // Verificar autenticación
    const authTime = localStorage.getItem('admin-auth-time')
    if (authTime) {
      const elapsed = Date.now() - parseInt(authTime)
      if (elapsed < 4 * 60 * 60 * 1000) {
        setAuthenticated(true)
      } else {
        localStorage.removeItem('admin-auth-time')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authenticated) {
      loadData()
    }
  }, [authenticated])

  const loadData = async () => {
    try {
      // Cargar candidatos
      const candidatesData = await getCandidates()
      setCandidates(candidatesData)

      // Cargar votos del mes actual
      const currentMonth = new Date().toLocaleString('es', { month: 'long' })
      const currentYear = new Date().getFullYear().toString()
      const votesData = await getVotes(currentMonth, currentYear)
      setVotes(votesData)

      // Cargar estudiantes si estamos en modo auth
      if (USE_AUTH) {
        await loadStudents()
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadStudents = async () => {
    if (!USE_AUTH) return

    try {
      const data = await airtableRequest('Students')
      const studentsData = data.records.map((record: any) => ({
        id: record.id,
        username: record.fields.Username || '',
        nombre: record.fields.Nombre || '',
        apellido: record.fields.Apellido || '',
        grado: record.fields.Grado || '',
        curso: record.fields.Curso || '',
        active: record.fields.Active || false
      }))
      setStudents(studentsData)
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      localStorage.setItem('admin-auth-time', Date.now().toString())
    } else {
      alert('Contraseña incorrecta')
      setPassword("")
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    localStorage.removeItem('admin-auth-time')
    setPassword("")
  }

  const clearAllVotes = async () => {
    if (!confirm('¿Estás seguro de que quieres borrar todos los votos del mes actual?')) {
      return
    }

    if (USE_AUTH) {
      // Limpiar votos de Airtable
      try {
        const currentMonth = new Date().toLocaleString('es', { month: 'long' })
        const currentYear = new Date().getFullYear()
        const filterFormula = `AND({Mes} = "${currentMonth}", {Ano} = ${currentYear})`
        const data = await airtableRequest(`Votes?filterByFormula=${encodeURIComponent(filterFormula)}`)
        
        // Eliminar cada registro
        for (const record of data.records) {
          await airtableRequest(`Votes/${record.id}`, 'DELETE')
        }
        
        setVotes({})
        alert('Votos eliminados exitosamente')
      } catch (error) {
        console.error('Error clearing votes:', error)
        alert('Error al eliminar votos')
      }
    } else {
      // Modo demo
      localStorage.removeItem('demo-votes')
      setVotes({})
    }
  }

  const addStudent = async () => {
    if (!newStudent.username || !newStudent.nombre || !newStudent.apellido) {
      alert('Complete todos los campos obligatorios')
      return
    }

    if (USE_AUTH) {
      try {
        await airtableRequest('Students', 'POST', {
          fields: {
            Username: newStudent.username,
            Password: newStudent.password,
            Nombre: newStudent.nombre,
            Apellido: newStudent.apellido,
            Grado: newStudent.grado,
            Curso: newStudent.curso,
            Active: true
          }
        })

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
      } catch (error) {
        console.error('Error adding student:', error)
        alert('Error al agregar estudiante')
      }
    }
  }

  const exportData = () => {
    const data = {
      candidates,
      votes,
      students: USE_AUTH ? students : [],
      exportDate: new Date().toISOString(),
      month: new Date().toLocaleString('es', { month: 'long' }),
      year: new Date().getFullYear()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `votacion-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0)
  const activeStudents = students.filter(s => s.active).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Panel de Administración</CardTitle>
            <p className="text-sm text-gray-600">
              Acceso exclusivo para docentes y administradores
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña de administrador"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <Button type="submit" className="w-full">
                Acceder al Panel
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                <strong>Credencial:</strong> colegio2024
              </p>
            </div>
            
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="text-sm"
              >
                ← Volver a Votación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Panel de Administración
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {USE_AUTH ? 'Sistema con autenticación activado' : 'Modo Demo - Datos de prueba'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportData} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={() => window.location.href = '/resultados'} variant="outline" size="sm">
                  Ver Resultados
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Navegación */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-1">
              <Button
                variant={activeTab === 'stats' ? 'default' : 'outline'}
                onClick={() => setActiveTab('stats')}
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Estadísticas
              </Button>
              {USE_AUTH && (
                <Button
                  variant={activeTab === 'students' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('students')}
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Estudiantes ({activeStudents})
                </Button>
              )}
              <Button
                variant={activeTab === 'candidates' ? 'default' : 'outline'}
                onClick={() => setActiveTab('candidates')}
                size="sm"
              >
                <Vote className="w-4 h-4 mr-2" />
                Candidatos ({candidates.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contenido según tab activo */}
        {activeTab === 'stats' && (
          <>
            {/* Estadísticas Generales */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{totalVotes}</p>
                    <p className="text-sm text-gray-600">Total de Votos</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{candidates.length}</p>
                    <p className="text-sm text-gray-600">Candidatos Activos</p>
                  </div>
                </CardContent>
              </Card>

              {USE_AUTH && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{activeStudents}</p>
                      <p className="text-sm text-gray-600">Estudiantes Activos</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {Object.keys(votes).length}
                    </p>
                    <p className="text-sm text-gray-600">Han Recibido Votos</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalles de Votos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Votos por Candidato - {new Date().toLocaleString('es', { month: 'long' })}</CardTitle>
                  <Button onClick={clearAllVotes} variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar Votos
                  </Button>
                </div>
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

        {activeTab === 'students' && USE_AUTH && (
          <>
            {/* Agregar Estudiante */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Agregar Nuevo Estudiante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Usuario:</label>
                    <Input
                      placeholder="nombre.apellido"
                      value={newStudent.username}
                      onChange={(e) => setNewStudent({...newStudent, username: e.target.value})}
                    />
                  </div>
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
                  <div>
                    <label className="text-sm font-medium mb-2 block">Grado:</label>
                    <Select value={newStudent.grado} onValueChange={(value) => setNewStudent({...newStudent, grado: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["1ro", "2do", "3ro", "4to", "5to", "6to"].map((grado) => (
                          <SelectItem key={grado} value={grado}>{grado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Curso:</label>
                    <Select value={newStudent.curso} onValueChange={(value) => setNewStudent({...newStudent, curso: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Arrayan", "Jacarandá", "Ceibo"].map((curso) => (
                          <SelectItem key={curso} value={curso}>{curso}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addStudent} className="w-full">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Estudiantes */}
            <Card>
              <CardHeader>
                <CardTitle>Estudiantes Registrados ({students.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{student.apellido}, {student.nombre}</p>
                        <p className="text-sm text-gray-600">
                          @{student.username} • {student.grado} {student.curso}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          student.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {student.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'candidates' && (
          <Card>
            <CardHeader>
              <CardTitle>Candidatos Registrados ({candidates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{candidate.apellido}, {candidate.nombre}</p>
                      <p className="text-sm text-gray-600">{candidate.grado} {candidate.curso}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{votes[candidate.id] || 0}</p>
                      <p className="text-sm text-gray-600">votos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}