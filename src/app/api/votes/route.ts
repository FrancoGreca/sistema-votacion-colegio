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

// GET - Obtener votos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const ano = searchParams.get('ano')

    // Si no está configurado Airtable, devolver datos demo
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      
      if (typeof window !== 'undefined') {
        const demoVotes = JSON.parse(localStorage.getItem('demo-votes') || '{}')
        return NextResponse.json(demoVotes)
      } else {
        // En el servidor, devolver votos demo estáticos
        return NextResponse.json({
          "1": 5, "2": 3, "3": 8, "4": 2, "5": 6
        })
      }
    }

    if (!mes || !ano) {
      return NextResponse.json({}, { status: 400 })
    }

    const filterFormula = `AND({Mes} = "${mes}", {Ano} = ${ano})`
    const data = await airtableRequest(`Votes?filterByFormula=${encodeURIComponent(filterFormula)}`)
    
    const votes: Record<string, number> = {}
    data.records.forEach((record: AirtableVoteRecord) => {
      const candidateId = record.fields.CandidateId
      if (candidateId) {
        votes[candidateId] = (votes[candidateId] || 0) + 1
      }
    })
    
    return NextResponse.json(votes)
  } catch (error) {
    console.error('Get votes error:', error)
    return NextResponse.json({}, { status: 500 })
  }
}

// POST - Crear voto
export async function POST(request: NextRequest) {
  try {
    const requestBody: VoteRequestBody = await request.json()
    const { studentUsername, candidateId, mes, ano } = requestBody

    // Si no está configurado Airtable, usar localStorage
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      
      // Para demo, simplemente devolvemos éxito
      return NextResponse.json({ success: true })
    }

    // Verificar si ya votó este mes
    const checkFilter = `AND({StudentUsername} = "${studentUsername}", {Mes} = "${mes}", {Ano} = ${ano})`
    const existingVotes = await airtableRequest(`Votes?filterByFormula=${encodeURIComponent(checkFilter)}`)
    
    if (existingVotes.records.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Ya votaste este mes'
      })
    }

    // Crear nuevo voto
    await airtableRequest('Votes', 'POST', {
      fields: {
        VoteId: `${studentUsername}-${mes}-${ano}`,
        StudentUsername: studentUsername,
        CandidateId: candidateId,
        Mes: mes,
        Ano: ano,
        Timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save vote error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al guardar voto'
    }, { status: 500 })
  }
}