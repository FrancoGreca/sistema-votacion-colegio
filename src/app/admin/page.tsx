'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, BarChart3, Trash2 } from "lucide-react"

const ADMIN_PASSWORD = "colegio2024"

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [votes, setVotes] = useState<Record<string, number>>({})

  // Datos de candidatos (mismos que en otras páginas)
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

  useEffect(() => {
    // Verificar autenticación
    const authTime = localStorage.getItem('admin-auth-time')
    if (authTime) {
      const elapsed = Date.now() - parseInt(authTime)
      if (elapsed < 4 * 60 * 60 * 1000) { // 4 horas
        setAuthenticated(true)
      } else {
        localStorage.removeItem('admin-auth-time')
      }
    }

    // Cargar votos
    const savedVotes = localStorage.getItem('demo-votes')
    if (savedVotes) {
      setVotes(JSON.parse(savedVotes))
    }

    setLoading(false)
  }, [])

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

  const clearAllVotes = () => {
    if (confirm('¿Estás seguro de que quieres borrar todos los votos?')) {
      localStorage.removeItem('demo-votes')
      setVotes({})
    }
  }

  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0)

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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <Button type="submit" className="w-full">
                Acceder al Panel
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                <strong>Credencial de prueba:</strong><br />
                Contraseña: colegio2024
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
      <div className="max-w-4xl mx-auto space-y-6">
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
                  Gestión del sistema de votación - Modo Demo
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.href = '/resultados'}
                  variant="outline"
                  size="sm"
                >
                  Ver Resultados
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                >
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Estadísticas Generales */}
        <div className="grid md:grid-cols-3 gap-4">
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
                <p className="text-2xl font-bold text-green-600">{candidatos.length}</p>
                <p className="text-sm text-gray-600">Candidatos Activos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
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
              <CardTitle>Votos por Candidato</CardTitle>
              <Button 
                onClick={clearAllVotes}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar Votos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {totalVotes === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No hay votos registrados</p>
                <p className="text-sm text-gray-400">
                  Los votos aparecerán aquí una vez que los estudiantes empiecen a votar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidatos
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
                          <p className="font-medium">
                            {candidato.apellido}, {candidato.nombre}
                          </p>
                          <p className="text-sm text-gray-600">
                            {candidato.grado} {candidato.curso}
                          </p>
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

        {/* Enlaces Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Enlaces Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Ir a Página de Votación
              </Button>
              <Button 
                onClick={() => window.location.href = '/resultados'}
                variant="outline"
                className="w-full"
              >
                Ver Resultados Públicos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
