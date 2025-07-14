// src/app/api/check-vote/route.ts
import { NextRequest, NextResponse } from 'next/server'

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

async function airtableRequest(table: string) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`
  
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentUsername = searchParams.get('username')

    if (!studentUsername) {
      return NextResponse.json({ hasVoted: false }, { status: 400 })
    }

    // Si no está configurado Airtable, devolver false (modo demo)
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      return NextResponse.json({ hasVoted: false })
    }

    const currentDate = new Date()
    const currentMonth = formatMonthForAirtable(currentDate) // ✅ CORREGIDO
    const currentYear = currentDate.getFullYear()

    console.log('Checking vote with month format:', currentMonth) // Debug

    const filterFormula = `AND(
      {StudentUsername} = "${studentUsername}", 
      {Mes} = "${currentMonth}", 
      {Ano} = ${currentYear}
    )`
    
    const data = await airtableRequest(`Votes?filterByFormula=${encodeURIComponent(filterFormula)}`)
    
    return NextResponse.json({ 
      hasVoted: data.records.length > 0 
    })
  } catch (error) {
    console.error('Check vote error:', error)
    return NextResponse.json({ 
      hasVoted: false 
    })
  }
}