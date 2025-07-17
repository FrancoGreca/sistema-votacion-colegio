// src/utils/offline.ts - Capacidades Offline y Sync
import { CompatibilityAdapter } from '../application/adapters/CompatibilityAdapter'

export interface OfflineVote {
  id: string
  studentUsername: string
  candidateId: string
  mes: string
  ano: number
  timestamp: number
  synced: boolean
}

export interface OfflineData {
  candidates: any[]
  votes: OfflineVote[]
  lastSync: number
}

/**
 * Gestor de datos offline
 */
export class OfflineManager {
  private dbName = 'voting-offline'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private isOnline = navigator.onLine
  private syncQueue: OfflineVote[] = []

  constructor() {
    this.init()
    this.setupEventListeners()
  }

  private async init() {
    try {
      this.db = await this.openDB()
      console.log('📱 Offline database initialized')
      
      // Sync pending votes if online
      if (this.isOnline) {
        await this.syncPendingVotes()
      }
    } catch (error) {
      console.error('❌ Failed to initialize offline database:', error)
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Store for candidates
        if (!db.objectStoreNames.contains('candidates')) {
          db.createObjectStore('candidates', { keyPath: 'id' })
        }
        
        // Store for offline votes
        if (!db.objectStoreNames.contains('votes')) {
          const voteStore = db.createObjectStore('votes', { keyPath: 'id' })
          voteStore.createIndex('synced', 'synced', { unique: false })
          voteStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        // Store for app metadata
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  private setupEventListeners() {
    // Online/Offline detection
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('🌐 Connection restored - syncing data...')
      this.syncPendingVotes()
      this.dispatchConnectivityEvent('online')
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('📱 Offline mode activated')
      this.dispatchConnectivityEvent('offline')
    })

    // Page visibility for background sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingVotes()
      }
    })
  }

  private dispatchConnectivityEvent(status: 'online' | 'offline') {
    const event = new CustomEvent('connectivity-change', { 
      detail: { status, hasOfflineVotes: this.syncQueue.length > 0 } 
    })
    window.dispatchEvent(event)
  }

  // Candidates management
  async saveCandidatesOffline(candidates: any[]): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['candidates', 'metadata'], 'readwrite')
    const candidateStore = transaction.objectStore('candidates')
    const metadataStore = transaction.objectStore('metadata')

    // Clear existing candidates
    await candidateStore.clear()
    
    // Save new candidates
    for (const candidate of candidates) {
      await candidateStore.add(candidate)
    }

    // Update last sync timestamp
    await metadataStore.put({
      key: 'candidates_last_sync',
      value: Date.now()
    })

    console.log('📱 Candidates saved offline:', candidates.length)
  }

  async getCandidatesOffline(): Promise<any[]> {
    if (!this.db) return []

    const transaction = this.db.transaction(['candidates'], 'readonly')
    const store = transaction.objectStore('candidates')
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Votes management
  async saveVoteOffline(voteData: {
    studentUsername: string
    candidateId: string
    mes: string
    ano: number
  }): Promise<string> {
    const vote: OfflineVote = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...voteData,
      timestamp: Date.now(),
      synced: false
    }

    if (this.db) {
      const transaction = this.db.transaction(['votes'], 'readwrite')
      const store = transaction.objectStore('votes')
      await store.add(vote)
      console.log('📱 Vote saved offline:', vote.id)
    }

    this.syncQueue.push(vote)

    // Try to sync immediately if online
    if (this.isOnline) {
      setTimeout(() => this.syncPendingVotes(), 1000)
    }

    return vote.id
  }

  async getOfflineVotes(): Promise<OfflineVote[]> {
    if (!this.db) return []

    const transaction = this.db.transaction(['votes'], 'readonly')
    const store = transaction.objectStore('votes')
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async syncPendingVotes(): Promise<void> {
    if (!this.isOnline || !this.db) return

    const pendingVotes = await this.getUnsyncedVotes()
    if (pendingVotes.length === 0) {
      console.log('📱 No pending votes to sync')
      return
    }

    console.log(`📱 Syncing ${pendingVotes.length} pending votes...`)

    for (const vote of pendingVotes) {
      try {
        const success = await CompatibilityAdapter.saveAuthenticatedVote(
          vote.studentUsername,
          vote.candidateId
        )

        if (success) {
          await this.markVoteAsSynced(vote.id)
          console.log('✅ Vote synced:', vote.id)
        } else {
          console.warn('❌ Failed to sync vote:', vote.id)
        }
      } catch (error) {
        console.error('❌ Error syncing vote:', vote.id, error)
      }
    }

    // Update sync queue
    this.syncQueue = this.syncQueue.filter(v => !v.synced)

    // Dispatch sync completion event
    const event = new CustomEvent('offline-sync-complete', {
      detail: { syncedCount: pendingVotes.length }
    })
    window.dispatchEvent(event)
  }

  private async getUnsyncedVotes(): Promise<OfflineVote[]> {
    if (!this.db) return []

    const transaction = this.db.transaction(['votes'], 'readonly')
    const store = transaction.objectStore('votes')
    const index = store.index('synced')
    const request = index.getAll(false) // Get unsynced votes

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async markVoteAsSynced(voteId: string): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['votes'], 'readwrite')
    const store = transaction.objectStore('votes')
    
    const getRequest = store.get(voteId)
    getRequest.onsuccess = () => {
      const vote = getRequest.result
      if (vote) {
        vote.synced = true
        store.put(vote)
      }
    }
  }

  // Connectivity helpers
  isOffline(): boolean {
    return !this.isOnline
  }

  hasOfflineData(): boolean {
    return this.syncQueue.length > 0
  }

  async getOfflineStats(): Promise<{
    candidatesCount: number
    pendingVotesCount: number
    lastSync: number | null
  }> {
    const candidates = await this.getCandidatesOffline()
    const pendingVotes = await this.getUnsyncedVotes()
    
    let lastSync = null
    if (this.db) {
      const transaction = this.db.transaction(['metadata'], 'readonly')
      const store = transaction.objectStore('metadata')
      const request = store.get('candidates_last_sync')
      
      lastSync = await new Promise<number | null>((resolve) => {
        request.onsuccess = () => resolve(request.result?.value || null)
        request.onerror = () => resolve(null)
      })
    }

    return {
      candidatesCount: candidates.length,
      pendingVotesCount: pendingVotes.length,
      lastSync
    }
  }

  // Cleanup
  async clearOfflineData(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['candidates', 'votes', 'metadata'], 'readwrite')
    await Promise.all([
      transaction.objectStore('candidates').clear(),
      transaction.objectStore('votes').clear(),
      transaction.objectStore('metadata').clear()
    ])

    this.syncQueue = []
    console.log('📱 Offline data cleared')
  }

  destroy(): void {
    if (this.db) {
      this.db.close()
    }
  }
}

// Singleton instance
export const offlineManager = new OfflineManager()

/**
 * React hook para capacidades offline
 */
import { useState, useEffect } from 'react'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [hasOfflineVotes, setHasOfflineVotes] = useState(false)
  const [offlineStats, setOfflineStats] = useState({
    candidatesCount: 0,
    pendingVotesCount: 0,
    lastSync: null as number | null
  })

  useEffect(() => {
    const handleConnectivityChange = (event: CustomEvent) => {
      setIsOnline(event.detail.status === 'online')
      setHasOfflineVotes(event.detail.hasOfflineVotes)
    }

    const handleSyncComplete = (event: CustomEvent) => {
      console.log(`📱 Sync completed: ${event.detail.syncedCount} votes`)
      updateOfflineStats()
    }

    const updateOfflineStats = async () => {
      const stats = await offlineManager.getOfflineStats()
      setOfflineStats(stats)
    }

    window.addEventListener('connectivity-change', handleConnectivityChange as EventListener)
    window.addEventListener('offline-sync-complete', handleSyncComplete as EventListener)
    
    updateOfflineStats()

    return () => {
      window.removeEventListener('connectivity-change', handleConnectivityChange as EventListener)
      window.removeEventListener('offline-sync-complete', handleSyncComplete as EventListener)
    }
  }, [])

  const voteOffline = async (voteData: {
    studentUsername: string
    candidateId: string
    mes: string
    ano: number
  }) => {
    const voteId = await offlineManager.saveVoteOffline(voteData)
    setHasOfflineVotes(true)
    
    const stats = await offlineManager.getOfflineStats()
    setOfflineStats(stats)
    
    return voteId
  }

  const syncNow = async () => {
    if (isOnline) {
      await offlineManager.syncPendingVotes()
    }
  }

  return {
    isOnline,
    isOffline: !isOnline,
    hasOfflineVotes,
    offlineStats,
    voteOffline,
    syncNow
  }
}

/**
 * Componente de estado de conectividad
 */
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, Sync, AlertCircle } from 'lucide-react'

interface ConnectivityStatusProps {
  className?: string
}

export function ConnectivityStatus({ className = '' }: ConnectivityStatusProps) {
  const { isOnline, hasOfflineVotes, offlineStats, syncNow } = useOffline()
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncNow()
    } finally {
      setSyncing(false)
    }
  }

  if (isOnline && !hasOfflineVotes) {
    return null // Hide when online and no pending data
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            
            <div>
              <p className="font-medium text-orange-800">
                {isOnline ? 'Conectado' : 'Sin conexión'}
              </p>
              {hasOfflineVotes && (
                <p className="text-sm text-orange-700">
                  {offlineStats.pendingVotesCount} votos pendientes de sincronizar
                </p>
              )}
            </div>
          </div>

          {isOnline && hasOfflineVotes && (
            <Button
              onClick={handleSync}
              disabled={syncing}
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {syncing ? (
                <>
                  <Sync className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Sync className="w-4 h-4 mr-2" />
                  Sincronizar
                </>
              )}
            </Button>
          )}

          {!isOnline && (
            <AlertCircle className="w-5 h-5 text-orange-600" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}