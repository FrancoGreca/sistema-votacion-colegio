"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

export default function DiagnosticPage() {
  const [results, setResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)

  const runDiagnostics = async () => {
    setTesting(true)
    const diagnostics = []

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

    // Test 2: Formato de credenciales
    const apiKeyValid = apiKey && apiKey.startsWith('pat')
    const baseIdValid = baseId && baseId.startsWith('app')

    diagnostics.push({
      test: "Formato de credenciales",
      status: apiKeyValid && baseIdValid ? "success" : "error",
      details: {
        "API Key formato": apiKeyValid ? "✅ Empieza con 'pat'" : "❌ Debe empezar con 'pat'",
        "Base ID formato": baseIdValid ? "✅ Empieza con 'app'" : "❌ Debe empezar con 'app'"
      }
    })

    // Test 3: Conectividad a Airtable
    if (apiKey && baseId) {
      try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/Students?maxRecords=1`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        })

        diagnostics.push({
          test: "Conexión a Airtable",
          status: response.ok ? "success" : "error",
          details: {
            "Status": `${response.status} ${response.statusText}`,
            "URL": `https://api.airtable.com/v0/${baseId}/Students`,
            "Headers": response.ok ? "✅ Correctos" : "❌ Error de autenticación"
          }
        })

        if (response.ok) {
          const data = await response.json()
          diagnostics.push({
            test: "Estructura de datos",
            status: "success",
            details: {
              "Registros encontrados": data.records?.length || 0,
              "Estructura": data.records?.length > 0 ? "✅ Datos disponibles" : "⚠️ Tabla vacía"
            }
          })
        }
      } catch (error) {
        diagnostics.push({
          test: "Conexión a Airtable", 
          status: "error",
          details: {
            "Error": error.message,
            "Tipo": "Error de red o CORS"
          }
        })
      }
    }

    // Test 4: Tabla Students
    if (apiKey && baseId) {
      try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/Students`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          diagnostics.push({
            test: "Tabla Students",
            status: "success", 
            details: {
              "Estudiantes": data.records?.length || 0,
              "Primeros usuarios": data.records?.slice(0, 3).map((r: any) => r.fields.Username).join(", ") || "Ninguno"
            }
          })
        }
      } catch (error) {
        diagnostics.push({
          test: "Tabla Students",
          status: "error",
          details: {
            "Error": error.message
          }
        })
      }
    }

    setResults(diagnostics)
    setTesting(false)
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "success") return <CheckCircle className="w-5 h-5 text-green-600" />
    if (status === "error") return <XCircle className="w-5 h-5 text-red-600" />
    return <AlertCircle className="w-5 h-5 text-yellow-600" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">🔧 Diagnóstico del Sistema</CardTitle>
            <p className="text-gray-600">
              Herramienta para diagnosticar problemas de conexión con Airtable
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
                "🚀 Ejecutar Diagnósticos"
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
                        <span className="text-sm">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">📋 Pasos para Solucionar:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Verificar que las variables de entorno estén en .env.local</li>
                <li>2. Reiniciar el servidor (npm run dev)</li>
                <li>3. Verificar credenciales en Airtable</li>
                <li>4. Verificar que las tablas existan en Airtable</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
