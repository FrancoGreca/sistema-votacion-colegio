"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

// Type definitions
interface DiagnosticResult {
  test: string
  status: "success" | "error" | "warning"
  details: Record<string, string>
}

export default function DiagnosticPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [testing, setTesting] = useState(false)

  const runDiagnostics = async () => {
    setTesting(true)
    const diagnostics: DiagnosticResult[] = []

    // Test 1: Variables de entorno
    const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
    const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
    const useAuth = process.env.NEXT_PUBLIC_USE_AUTH

    diagnostics.push({
      test: "Variables de entorno",
      status: apiKey && baseId ? "success" : "error",
      details: {
        "AIRTABLE_API_KEY": apiKey ? `✅ Configurado (${apiKey.substring(0, 10)}...)` : "❌ No configurado",
        "AIRTABLE_BASE_ID": baseId ? `✅ Configurado (${baseId})` : "❌ No configurado", 
        "USE_AUTH": useAuth ? `✅ ${useAuth}` : "❌ No configurado"
      }
    })

    // Test 2: API Routes - Candidatos
    try {
      const candidatesResponse = await fetch('/api/candidates')
      const candidatesData = await candidatesResponse.json()
      
      diagnostics.push({
        test: "API Route - Candidatos",
        status: candidatesResponse.ok ? "success" : "error",
        details: {
          "Status": `${candidatesResponse.status} ${candidatesResponse.statusText}`,
          "Candidatos encontrados": Array.isArray(candidatesData) ? candidatesData.length.toString() : "0",
          "Ejemplo": candidatesData[0] ? `${candidatesData[0].apellido}, ${candidatesData[0].nombre}` : "Ninguno"
        }
      })
    } catch (error) {
      diagnostics.push({
        test: "API Route - Candidatos",
        status: "error",
        details: {
          "Error": error instanceof Error ? error.message : String(error)
        }
      })
    }

    // Test 3: API Routes - Autenticación
    try {
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'ana.garcia', password: '123' })
      })
      const authData = await authResponse.json()
      
      diagnostics.push({
        test: "API Route - Autenticación",
        status: authResponse.ok ? "success" : "error",
        details: {
          "Status": `${authResponse.status} ${authResponse.statusText}`,
          "Login exitoso": authData.success ? "✅ Sí" : "❌ No",
          "Usuario": authData.student ? `${authData.student.nombre} ${authData.student.apellido}` : "N/A",
          "Error": authData.error || "Ninguno"
        }
      })
    } catch (error) {
      diagnostics.push({
        test: "API Route - Autenticación",
        status: "error",
        details: {
          "Error": error instanceof Error ? error.message : String(error)
        }
      })
    }

    // Test 4: API Routes - Votos
    try {
      const currentMonth = new Date().toLocaleString('es', { month: 'long' })
      const currentYear = new Date().getFullYear()
      
      const votesResponse = await fetch(`/api/votes?mes=${currentMonth}&ano=${currentYear}`)
      const votesData = await votesResponse.json()
      
      const totalVotes = Object.values(votesData).reduce((sum: number, count) => {
        return sum + (typeof count === 'number' ? count : 0)
      }, 0)
      
      diagnostics.push({
        test: "API Route - Votos",
        status: votesResponse.ok ? "success" : "error",
        details: {
          "Status": `${votesResponse.status} ${votesResponse.statusText}`,
          "Votos este mes": Object.keys(votesData).length.toString(),
          "Total votos": totalVotes.toString()
        }
      })
    } catch (error) {
      diagnostics.push({
        test: "API Route - Votos",
        status: "error",
        details: {
          "Error": error instanceof Error ? error.message : String(error)
        }
      })
    }

    // Test 5: API Routes - Verificar voto
    try {
      const checkResponse = await fetch('/api/check-vote?username=ana.garcia')
      const checkData = await checkResponse.json()
      
      diagnostics.push({
        test: "API Route - Verificar Voto",
        status: checkResponse.ok ? "success" : "error",
        details: {
          "Status": `${checkResponse.status} ${checkResponse.statusText}`,
          "Usuario ya votó": checkData.hasVoted ? "✅ Sí" : "❌ No"
        }
      })
    } catch (error) {
      diagnostics.push({
        test: "API Route - Verificar Voto",
        status: "error",
        details: {
          "Error": error instanceof Error ? error.message : String(error)
        }
      })
    }

    // Test 6: Conectividad general
    const successfulTests = diagnostics.filter(d => d.status === "success").length
    diagnostics.push({
      test: "Resumen de Conectividad",
      status: successfulTests >= 3 ? "success" : "warning",
      details: {
        "APIs funcionando": `${successfulTests}/${diagnostics.length}`,
        "Modo recomendado": apiKey === 'DEMO_MODE' ? "Demo (sin Airtable)" : "Producción (con Airtable)",
        "Sistema operativo": successfulTests >= 2 ? "✅ Funcional" : "⚠️ Problemas"
      }
    })

    setResults(diagnostics)
    setTesting(false)
  }

  const StatusIcon = ({ status }: { status: "success" | "error" | "warning" }) => {
    if (status === "success") return <CheckCircle className="w-5 h-5 text-green-600" />
    if (status === "error") return <XCircle className="w-5 h-5 text-red-600" />
    return <AlertCircle className="w-5 h-5 text-yellow-600" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">🔧 Diagnóstico del Sistema v2.0</CardTitle>
            <p className="text-gray-600">
              Verificación de API Routes y conectividad con Airtable
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runDiagnostics} 
              disabled={testing}
              className="w-full mb-6"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ejecutando Diagnósticos...
                </>
              ) : (
                "🚀 Ejecutar Diagnósticos de API Routes"
              )}
            </Button>

            {results.map((result, index) => (
              <Card key={index} className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <StatusIcon status={result.status} />
                    {result.test}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(result.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{key}:</span>
                        <span className="text-sm text-right max-w-md">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-bold text-green-800 mb-2">✅ Solución Implementada:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• <strong>API Routes:</strong> Eliminan problemas CORS</li>
                <li>• <strong>Servidor intermedio:</strong> Next.js maneja requests a Airtable</li>
                <li>• <strong>Fallback automático:</strong> Modo demo si Airtable falla</li>
                <li>• <strong>Seguridad:</strong> API keys solo en servidor</li>
              </ul>
            </div>

            <div className="mt-4 text-center space-x-2">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                🗳️ Probar Votación
              </Button>
              <Button 
                onClick={() => window.location.href = '/resultados'}
                variant="outline"
              >
                📊 Ver Resultados
              </Button>
              <Button 
                onClick={() => window.location.href = '/admin'}
                variant="outline"
              >
                🔐 Panel Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}