// src/lib/auth.ts

interface Student {
  id: string
  username: string
  nombre: string
  apellido: string
  grado: string
  curso: string
  active: boolean
}

interface AuthResponse {
  success: boolean
  student?: Student
  error?: string
}

interface Candidate {
  id: string
  nombre: string
  apellido: string
  grado: string
  curso: string
}

// Autenticar estudiante usando API route
export const authenticateStudent = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      throw new Error('Network error')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error authenticating student:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Verificar si ya votó este mes usando API route
export const hasVotedThisMonth = async (studentUsername: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/check-vote?username=${encodeURIComponent(studentUsername)}`)
    
    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.hasVoted
  } catch (error) {
    console.error('Error checking vote status:', error)
    return false
  }
}

// Guardar voto autenticado usando API route
export const saveAuthenticatedVote = async (
  studentUsername: string, 
  candidateId: string
): Promise<boolean> => {
  try {
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleString('es', { month: 'long' })
    const currentYear = currentDate.getFullYear()

    const response = await fetch('/api/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentUsername,
        candidateId,
        mes: currentMonth,
        ano: currentYear
      }),
    })

    if (!response.ok) {
      throw new Error('Network error')
    }

    const data = await response.json()
    
    // Si es modo demo, también guardar en localStorage
    if (data.success) {
      const votes = JSON.parse(localStorage.getItem('demo-votes') || '{}')
      votes[candidateId] = (votes[candidateId] || 0) + 1
      localStorage.setItem('demo-votes', JSON.stringify(votes))
    }
    
    return data.success
  } catch (error) {
    console.error('Error saving vote:', error)
    return false
  }
}

// Obtener candidatos usando API route
export const getCandidates = async (): Promise<Candidate[]> => {
  try {
    const response = await fetch('/api/candidates')
    
    if (!response.ok) {
      throw new Error('Network error')
    }

    const candidates = await response.json()
    return candidates
  } catch (error) {
    console.error('Error fetching candidates:', error)
    // Fallback a datos demo
    return [
      { id: "1", nombre: "Ana", apellido: "García", grado: "1ro", curso: "Arrayan" },
      { id: "2", nombre: "Luis", apellido: "Martín", grado: "1ro", curso: "Arrayan" },
      { id: "3", nombre: "Sofia", apellido: "López", grado: "1ro", curso: "Ceibo" },
      { id: "4", nombre: "Carlos", apellido: "Rodríguez", grado: "2do", curso: "Jacarandá" },
      { id: "5", nombre: "María", apellido: "Fernández", grado: "2do", curso: "Arrayan" },
    ]
  }
}

// Obtener votos usando API route
export const getVotes = async (mes: string, ano: string): Promise<Record<string, number>> => {
  try {
    const response = await fetch(`/api/votes?mes=${encodeURIComponent(mes)}&ano=${encodeURIComponent(ano)}`)
    
    if (!response.ok) {
      throw new Error('Network error')
    }

    const votes = await response.json()
    return votes
  } catch (error) {
    console.error('Error fetching votes:', error)
    // Fallback a localStorage para modo demo
    return JSON.parse(localStorage.getItem('demo-votes') || '{}')
  }
}

// Context para manejo de sesión (sin cambios)
export const getStoredUser = (): Student | null => {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem('current-student')
  if (!stored) return null
  
  try {
    const { student, timestamp } = JSON.parse(stored)
    // Sesión válida por 8 horas
    if (Date.now() - timestamp < 8 * 60 * 60 * 1000) {
      return student
    } else {
      localStorage.removeItem('current-student')
      return null
    }
  } catch {
    return null
  }
}

export const storeUser = (student: Student) => {
  localStorage.setItem('current-student', JSON.stringify({
    student,
    timestamp: Date.now()
  }))
}

export const clearStoredUser = () => {
  localStorage.removeItem('current-student')
}