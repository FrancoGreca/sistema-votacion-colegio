// src/app/api/candidates/route.ts
import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID

// Type definitions
interface AirtableRecord {
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
  records: AirtableRecord[]
}

interface Candidate {
  id: string
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

async function airtableRequest(table: string): Promise<AirtableResponse> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}?filterByFormula={Active} = TRUE()`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`Airtable error: ${response.status}`)
  }
  
  return response.json()
}

export async function GET() {
  try {
    // Si no está configurado Airtable, devolver datos demo
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      return NextResponse.json(demoCandidates)
    }

    const data = await airtableRequest('Candidates')
    const candidates: Candidate[] = data.records.map((record: AirtableRecord) => ({
      id: record.id,
      nombre: record.fields.Nombre || '',
      apellido: record.fields.Apellido || '',
      grado: record.fields.Grado || '',
      curso: record.fields.Curso || ''
    }))

    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Candidates error:', error)
    // En caso de error, devolver datos demo
    return NextResponse.json(demoCandidates)
  }
}