// src/app/api/votes/route.ts
import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID

// Type definitions
interface AirtableVoteRecord {
  id: string
  fields: {
    VoteId?: string
    StudentUsername?: string
    CandidateId?: string
    Mes?: string
    Ano?: number
    Timestamp?: string
    [key: string]: unknown
  }
}

interface AirtableResponse {
  records: AirtableVoteRecord[]
}

interface VoteRequestBody {
  studentUsername: string
  candidateId: string
  mes: string
  ano: number
}

async function airtableRequest(
  table: string, 
  method = 'GET', 
  body?: Record<string, unknown>
): Promise<AirtableResponse> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`
  
  console.log(`Airtable request: ${method} ${url}`)
  if (body) {
    console.log('Request body:', JSON.stringify(body, null, 2))
  }
  
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
  
  console.log(`Airtable response: ${response.status} ${response.statusText}`)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Airtable error response:', errorText)
    throw new Error(`Airtable error: ${response.status} - ${errorText}`)
  }
  
  const result = await response.json()
  console.log('Airtable success response:', JSON.stringify(result, null, 2))
  
  return result
}

// GET - Obtener votos
export async function GET(request: NextRequest) {
  console.log('=== GET /api/votes ===')
  
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const ano = searchParams.get('ano')

    console.log('Query params:', { mes, ano })

    // Si no está configurado Airtable, devolver datos demo
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      
      console.log('Using demo mode for GET votes')
      const demoVotes = {
        "1": 5, "2": 3, "3": 8, "4": 2, "5": 6
      }
      return NextResponse.json(demoVotes)
    }

    if (!mes || !ano) {
      console.log('Missing required parameters')
      return NextResponse.json({ error: 'Mes y año requeridos' }, { status: 400 })
    }

    const filterFormula = `AND({Mes} = "${mes}", {Ano} = ${ano})`
    console.log('Filter formula:', filterFormula)
    
    const data = await airtableRequest(`Votes?filterByFormula=${encodeURIComponent(filterFormula)}`)
    
    const votes: Record<string, number> = {}
    data.records.forEach((record: AirtableVoteRecord) => {
      const candidateId = record.fields.CandidateId
      if (candidateId) {
        votes[candidateId] = (votes[candidateId] || 0) + 1
      }
    })
    
    console.log('Processed votes:', votes)
    return NextResponse.json(votes)
  } catch (error) {
    console.error('Get votes error:', error)
    return NextResponse.json({ error: 'Error al obtener votos' }, { status: 500 })
  }
}

// POST - Crear voto
export async function POST(request: NextRequest) {
  console.log('=== POST /api/votes ===')
  
  try {
    // Leer el body
    const requestBody: VoteRequestBody = await request.json()
    console.log('Request body received:', requestBody)
    
    const { studentUsername, candidateId, mes, ano } = requestBody

    // Validar datos requeridos
    if (!studentUsername || !candidateId || !mes || !ano) {
      console.log('Missing required fields:', { studentUsername, candidateId, mes, ano })
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos'
      }, { status: 400 })
    }

    // Si no está configurado Airtable, usar modo demo
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      
      console.log('Using demo mode - Vote simulated:', { studentUsername, candidateId, mes, ano })
      
      // 🔒 VALIDACIÓN DEMO: Verificar localStorage para evitar votos duplicados
      if (typeof window !== 'undefined') {
        const demoVoteKey = `demo-vote-${studentUsername}-${mes}-${ano}`
        const hasVotedDemo = localStorage.getItem(demoVoteKey)
        
        if (hasVotedDemo) {
          return NextResponse.json({
            success: false,
            error: 'Ya votaste este mes (modo demo)'
          }, { status: 409 })
        }
        
        // Marcar como votado en demo
        localStorage.setItem(demoVoteKey, 'true')
      }
      
      // Para demo, simplemente devolvemos éxito
      return NextResponse.json({ success: true })
    }

    console.log('Using production mode with Airtable')
    console.log('Month received:', mes, 'Type:', typeof mes)

    // 🔒 VALIDACIÓN ANTI-DUPLICADOS MEJORADA
    console.log('Checking if user already voted this month...')
    
    // Verificar con múltiples filtros para mayor seguridad
    const checkFilters = [
      // Filtro principal
      `AND({StudentUsername} = "${studentUsername}", {Mes} = "${mes}", {Ano} = ${ano})`,
      // Filtro por VoteId único
      `{VoteId} = "${studentUsername}-${mes}-${ano}"`
    ]
    
    for (const filter of checkFilters) {
      console.log('Checking with filter:', filter)
      const existingVotes = await airtableRequest(`Votes?filterByFormula=${encodeURIComponent(filter)}`)
      
      if (existingVotes.records && existingVotes.records.length > 0) {
        console.log('Duplicate vote found with filter:', filter, 'Records:', existingVotes.records.length)
        return NextResponse.json({
          success: false,
          error: 'Ya votaste este mes'
        }, { status: 409 })
      }
    }

    console.log('No duplicate votes found, proceeding with vote creation...')

    // 🔒 VALIDACIÓN ADICIONAL: Verificar que el candidato existe
    console.log('Verifying candidate exists...')
    const candidateFilter = `AND({Active} = TRUE(), RECORD_ID() = "${candidateId}")`
    const candidateCheck = await airtableRequest(`Candidates?filterByFormula=${encodeURIComponent(candidateFilter)}`)
    
    if (!candidateCheck.records || candidateCheck.records.length === 0) {
      console.log('Invalid candidate ID:', candidateId)
      return NextResponse.json({
        success: false,
        error: 'Candidato no válido'
      }, { status: 400 })
    }

    console.log('Candidate verified, creating vote...')

    // Crear nuevo voto con ID único garantizado
    const uniqueVoteId = `${studentUsername}-${mes}-${ano}-${Date.now()}`
    const voteData = {
      fields: {
        VoteId: uniqueVoteId,
        StudentUsername: studentUsername,
        CandidateId: candidateId,
        Mes: mes,
        Ano: ano
        // Removemos Timestamp para evitar problemas de formato
      }
    }

    console.log('Creating vote with data:', voteData)
    
    const createResult = await airtableRequest('Votes', 'POST', voteData)

    console.log('Vote created successfully:', createResult)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Save vote error - Full details:', error)
    console.error('Error type:', typeof error)
    console.error('Error constructor:', error?.constructor?.name)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Proporcionar más detalles del error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json({
      success: false,
      error: 'Error al guardar voto',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}