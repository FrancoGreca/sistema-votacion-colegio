// src/app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID

async function airtableRequest(table: string, filterFormula?: string) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}${filterFormula ? `?filterByFormula=${encodeURIComponent(filterFormula)}` : ''}`
  
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

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Si no está configurado Airtable, devolver usuario demo
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      return NextResponse.json({
        success: true,
        student: {
          id: 'demo',
          username: username,
          nombre: 'Demo',
          apellido: 'User',
          grado: '1ro',
          curso: 'Arrayan',
          active: true
        }
      })
    }

    // Buscar estudiante en Airtable
    const filterFormula = `AND({Username} = "${username}", {Password} = "${password}", {Active} = TRUE())`
    const data = await airtableRequest('Students', filterFormula)
    
    if (data.records.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      })
    }

    const record = data.records[0]
    const student = {
      id: record.id,
      username: record.fields.Username || '',
      nombre: record.fields.Nombre || '',
      apellido: record.fields.Apellido || '',
      grado: record.fields.Grado || '',
      curso: record.fields.Curso || '',
      active: record.fields.Active || false
    }

    return NextResponse.json({
      success: true,
      student
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error de servidor'
    }, { status: 500 })
  }
}