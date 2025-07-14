// src/app/api/students/route.ts

import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID

// Type definitions
interface AirtableStudentRecord {
  id: string
  fields: {
    Username?: string
    Password?: string
    Nombre?: string
    Apellido?: string
    Grado?: string
    Curso?: string
    Active?: boolean
    [key: string]: unknown
  }
}

interface AirtableResponse {
  records: AirtableStudentRecord[]
}

interface Student {
  id: string
  username: string
  nombre: string
  apellido: string
  grado: string
  curso: string
  active: boolean
}

interface NewStudentBody {
  username: string
  password: string
  nombre: string
  apellido: string
  grado: string
  curso: string
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

// GET - Obtener estudiantes
export async function GET() {
  console.log('=== GET /api/students ===')
  
  try {
    // Si no está configurado Airtable, devolver array vacío
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      
      console.log('Using demo mode for GET students')
      return NextResponse.json([])
    }

    console.log('Using production mode with Airtable')

    const data = await airtableRequest('Students?filterByFormula={Active} = TRUE()')
    const students: Student[] = data.records.map((record: AirtableStudentRecord) => ({
      id: record.id,
      username: record.fields.Username || '',
      nombre: record.fields.Nombre || '',
      apellido: record.fields.Apellido || '',
      grado: record.fields.Grado || '',
      curso: record.fields.Curso || '',
      active: record.fields.Active || false
    }))

    console.log('Processed students:', students.length)
    return NextResponse.json(students)
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// POST - Agregar nuevo estudiante
export async function POST(request: NextRequest) {
  console.log('=== POST /api/students ===')
  
  try {
    const requestBody: NewStudentBody = await request.json()
    console.log('Request body received:', requestBody)
    
    const { username, password, nombre, apellido, grado, curso } = requestBody

    // Validar datos requeridos
    if (!username || !password || !nombre || !apellido || !grado || !curso) {
      console.log('Missing required fields:', { username, password, nombre, apellido, grado, curso })
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos: todos los campos son requeridos'
      }, { status: 400 })
    }

    // Si no está configurado Airtable, usar modo demo
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || 
        AIRTABLE_API_KEY === 'DEMO_MODE' || AIRTABLE_BASE_ID === 'DEMO_MODE') {
      
      console.log('Using demo mode - validating against demo restrictions')
      
      // En modo demo, simular validaciones básicas
      const usernameNorm = username.trim().toLowerCase()
      
      // Lista simple de usernames reservados para demo
      const reservedUsernames = ['admin', 'test', 'demo', 'root', 'administrator']
      
      if (reservedUsernames.includes(usernameNorm)) {
        return NextResponse.json({
          success: false,
          error: 'Nombre de usuario no disponible'
        }, { status: 409 })
      }
      
      // Para demo, devolver un estudiante con ID simulado
      const newStudent: Student = {
        id: Date.now().toString(),
        username: username.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        grado,
        curso,
        active: true
      }
      
      return NextResponse.json({ 
        success: true, 
        student: newStudent 
      })
    }

    console.log('Using production mode with Airtable')

    // 🔒 VALIDACIÓN ANTI-DUPLICADOS MÚLTIPLE
    console.log('Checking for duplicate students...')
    
    // Normalizar datos para validación
    const usernameNorm = username.trim().toLowerCase()
    const nombreNorm = nombre.trim().toLowerCase()
    const apellidoNorm = apellido.trim().toLowerCase()

    // Verificar si el username ya existe
    console.log('Checking username availability...')
    const usernameCheckFilter = `LOWER({Username}) = "${usernameNorm}"`
    console.log('Username check filter:', usernameCheckFilter)
    
    const existingUsername = await airtableRequest(`Students?filterByFormula=${encodeURIComponent(usernameCheckFilter)}`)
    
    if (existingUsername.records && existingUsername.records.length > 0) {
      console.log('Username already exists:', existingUsername.records.length, 'records found')
      return NextResponse.json({
        success: false,
        error: 'El nombre de usuario ya existe'
      }, { status: 409 })
    }

    // Verificar si ya existe un estudiante con el mismo nombre y apellido
    console.log('Checking for duplicate name combination...')
    const nameCheckFilter = `AND(
      LOWER({Nombre}) = "${nombreNorm}", 
      LOWER({Apellido}) = "${apellidoNorm}",
      {Active} = TRUE()
    )`
    console.log('Name check filter:', nameCheckFilter)
    
    const existingName = await airtableRequest(`Students?filterByFormula=${encodeURIComponent(nameCheckFilter)}`)
    
    if (existingName.records && existingName.records.length > 0) {
      console.log('Name combination already exists:', existingName.records.length, 'records found')
      return NextResponse.json({
        success: false,
        error: 'Ya existe un estudiante con ese nombre y apellido'
      }, { status: 409 })
    }

    console.log('No duplicates found, creating new student...')

    // Crear nuevo estudiante
    const studentData = {
      fields: {
        Username: username,
        Password: password,
        Nombre: nombre,
        Apellido: apellido,
        Grado: grado,
        Curso: curso,
        Active: true
      }
    }

    console.log('Creating student with data:', studentData)
    
    const createResult = await airtableRequest('Students', 'POST', studentData)

    if (createResult.records && createResult.records.length > 0) {
      const newRecord = createResult.records[0]
      const newStudent: Student = {
        id: newRecord.id,
        username: newRecord.fields.Username || '',
        nombre: newRecord.fields.Nombre || '',
        apellido: newRecord.fields.Apellido || '',
        grado: newRecord.fields.Grado || '',
        curso: newRecord.fields.Curso || '',
        active: newRecord.fields.Active || false
      }

      console.log('Student created successfully:', newStudent)
      return NextResponse.json({ 
        success: true, 
        student: newStudent 
      })
    } else {
      throw new Error('No se pudo crear el estudiante')
    }
    
  } catch (error) {
    console.error('Create student error - Full details:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json({
      success: false,
      error: 'Error al crear estudiante',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}