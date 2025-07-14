// src/app/api/candidates/route.ts

import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID

// Type definitions
interface AirtableCandidateRecord {
  id: string
  fields: {
    Nombre?: string
    Apellido?: string
    Grado?: string
    Curso?: string
    Active?: boolean
    [key: string]: unknown
  }
}

interface AirtableResponse {
  records: AirtableCandidateRecord[]
}

interface AirtableSingleResponse {
  id: string
  fields: {
    Nombre?: string
    Apellido?: string
    Grado?: string
    Curso?: string
    Active?: boolean
    [key: string]: unknown
  }
}

interface Candidate {
  id: string
  nombre: string
  apellido: string
  grado: string
  curso: string
}

interface NewCandidateBody {
  nombre: string
  apellido: string
  grado: string
  curso: string
}

// Datos demo
const demoCandidates: Candidate[] = [
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

async function airtableRequest(
  table: string, 
  method = 'GET', 
  body?: Record<string, unknown>
): Promise<AirtableResponse | AirtableSingleResponse> {
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

// GET - Obtener candidatos
export async function GET() {
  console.log('=== GET /api/candidates ===')
  
  try {
    // Si no está configurado Airtable, devolver datos demo
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      
      console.log('Using demo mode for GET candidates')
      return NextResponse.json(demoCandidates)
    }

    console.log('Using production mode with Airtable')

    const data = await airtableRequest('Candidates?filterByFormula={Active} = TRUE()') as AirtableResponse
    const candidates: Candidate[] = data.records.map((record: AirtableCandidateRecord) => ({
      id: record.id,
      nombre: record.fields.Nombre || '',
      apellido: record.fields.Apellido || '',
      grado: record.fields.Grado || '',
      curso: record.fields.Curso || ''
    }))

    console.log('Processed candidates:', candidates.length)
    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Get candidates error:', error)
    // En caso de error, devolver datos demo
    return NextResponse.json(demoCandidates)
  }
}

// POST - Agregar nuevo candidato
export async function POST(request: NextRequest) {
  console.log('=== POST /api/candidates ===')
  
  try {
    // Leer el body
    const requestBody: NewCandidateBody = await request.json()
    console.log('Request body received:', requestBody)
    
    const { nombre, apellido, grado, curso } = requestBody

    // Validar datos requeridos
    if (!nombre || !apellido || !grado || !curso) {
      console.log('Missing required fields:', { nombre, apellido, grado, curso })
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos: nombre, apellido, grado y curso son requeridos'
      }, { status: 400 })
    }

    // Normalizar datos para validación
    const nombreNorm = nombre.trim().toLowerCase()
    const apellidoNorm = apellido.trim().toLowerCase()

    // Si no está configurado Airtable, usar modo demo
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      
      console.log('Using demo mode - validating against demo data')
      
      // Validar duplicados en modo demo
      const isDuplicate = demoCandidates.some(candidate => 
        candidate.nombre.toLowerCase() === nombreNorm && 
        candidate.apellido.toLowerCase() === apellidoNorm
      )
      
      if (isDuplicate) {
        return NextResponse.json({
          success: false,
          error: 'Ya existe un candidato con ese nombre y apellido'
        }, { status: 409 })
      }
      
      // Para demo, devolver un candidato con ID simulado
      const newCandidate: Candidate = {
        id: Date.now().toString(),
        nombre,
        apellido,
        grado,
        curso
      }
      
      return NextResponse.json({ 
        success: true, 
        candidate: newCandidate 
      })
    }

    console.log('Using production mode with Airtable')

    // 🔒 VALIDACIÓN ANTI-DUPLICADOS
    console.log('Checking for duplicate candidates...')
    
    // Verificar si ya existe un candidato con el mismo nombre y apellido
    const duplicateCheckFilter = `AND(
      LOWER({Nombre}) = "${nombreNorm}", 
      LOWER({Apellido}) = "${apellidoNorm}",
      {Active} = TRUE()
    )`
    
    console.log('Duplicate check filter:', duplicateCheckFilter)
    
    const existingCandidates = await airtableRequest(`Candidates?filterByFormula=${encodeURIComponent(duplicateCheckFilter)}`) as AirtableResponse
    
    if (existingCandidates.records && existingCandidates.records.length > 0) {
      console.log('Duplicate candidate found:', existingCandidates.records.length, 'records')
      return NextResponse.json({
        success: false,
        error: 'Ya existe un candidato con ese nombre y apellido'
      }, { status: 409 })
    }

    console.log('No duplicates found, creating new candidate...')

    // Crear nuevo candidato
    const candidateData = {
      fields: {
        Nombre: nombre.trim(), // Guardar con formato original pero sin espacios extra
        Apellido: apellido.trim(),
        Grado: grado,
        Curso: curso,
        Active: true
      }
    }

    console.log('Creating candidate with data:', candidateData)
    
    const createResult = await airtableRequest('Candidates', 'POST', candidateData)

    // Airtable POST response puede venir en diferentes formatos
    let newRecord: AirtableSingleResponse
    if ('records' in createResult && createResult.records.length > 0) {
      // Formato con array de records
      newRecord = createResult.records[0]
    } else if ('id' in createResult) {
      // Formato directo del record
      newRecord = createResult as AirtableSingleResponse
    } else {
      console.error('Unexpected Airtable response format:', createResult)
      throw new Error('Formato de respuesta inesperado de Airtable')
    }

    const newCandidate: Candidate = {
      id: newRecord.id,
      nombre: newRecord.fields?.Nombre || '',
      apellido: newRecord.fields?.Apellido || '',
      grado: newRecord.fields?.Grado || '',
      curso: newRecord.fields?.Curso || ''
    }

    console.log('Candidate created successfully:', newCandidate)
    return NextResponse.json({ 
      success: true, 
      candidate: newCandidate 
    })
    
  } catch (error) {
    console.error('Create candidate error - Full details:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json({
      success: false,
      error: 'Error al crear candidato',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}