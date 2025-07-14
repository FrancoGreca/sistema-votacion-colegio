// src/app/api/admin/clear-votes/route.ts

import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID

// Función para formatear el mes correctamente para Airtable
const formatMonthForAirtable = (date: Date): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  
  return months[date.getMonth()]
}

// Type definitions
interface AirtableVoteRecord {
  id: string
  fields: {
    VoteId?: string
    StudentUsername?: string
    CandidateId?: string
    Mes?: string
    Ano?: number
    [key: string]: unknown
  }
}

interface AirtableResponse {
  records: AirtableVoteRecord[]
}

async function airtableRequest(
  table: string, 
  method = 'GET', 
  body?: Record<string, unknown>
): Promise<AirtableResponse> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`
  
  console.log(`Airtable request: ${method} ${url}`)
  
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
  
  // Para DELETE requests, Airtable puede devolver respuesta vacía
  if (method === 'DELETE') {
    return { records: [] }
  }
  
  const result = await response.json()
  console.log('Airtable success response:', JSON.stringify(result, null, 2))
  
  return result
}

// POST - Limpiar votos del mes actual
export async function POST() {
  console.log('=== POST /api/admin/clear-votes ===')
  
  try {
    // Si no está configurado Airtable, limpiar localStorage
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      
      console.log('Using demo mode - clearing localStorage')
      
      // En modo demo, simplemente indicamos éxito
      // El localStorage se limpia desde el frontend
      return NextResponse.json({ 
        success: true,
        message: 'Votos demo eliminados',
        cleared: 0
      })
    }

    console.log('Using production mode with Airtable')

    const currentDate = new Date()
    const currentMonth = formatMonthForAirtable(currentDate)
    const currentYear = currentDate.getFullYear()

    console.log('Clearing votes for:', { month: currentMonth, year: currentYear })

    // Buscar todos los votos del mes actual
    const filterFormula = `AND({Mes} = "${currentMonth}", {Ano} = ${currentYear})`
    console.log('Filter formula:', filterFormula)
    
    const votesToDelete = await airtableRequest(`Votes?filterByFormula=${encodeURIComponent(filterFormula)}`)
    
    console.log(`Found ${votesToDelete.records.length} votes to delete`)

    if (votesToDelete.records.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay votos para eliminar este mes',
        cleared: 0
      })
    }

    // Eliminar cada voto individualmente
    let deletedCount = 0
    for (const vote of votesToDelete.records) {
      try {
        console.log(`Deleting vote ${vote.id}...`)
        await airtableRequest(`Votes/${vote.id}`, 'DELETE')
        deletedCount++
      } catch (error) {
        console.error(`Error deleting vote ${vote.id}:`, error)
      }
    }

    console.log(`Successfully deleted ${deletedCount} out of ${votesToDelete.records.length} votes`)

    return NextResponse.json({
      success: true,
      message: `${deletedCount} votos eliminados exitosamente`,
      cleared: deletedCount
    })
    
  } catch (error) {
    console.error('Clear votes error - Full details:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar votos',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}