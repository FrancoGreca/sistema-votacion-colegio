// src/infrastructure/cache/MemoryCache.ts
import { ICacheService } from '../../core/interfaces/services/IServices';

interface CacheItem {
  value: any;
  expiry: number;
}

export class MemoryCache implements ICacheService {
  private cache: Map<string, CacheItem> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 60000) { // Limpiar cada minuto
    this.startCleanup(cleanupIntervalMs);
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = Array.from(this.cache.keys());
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    const keys = Array.from(this.cache.keys());
    
    // Estimación simple del uso de memoria
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;

    return {
      size: this.cache.size,
      keys,
      memoryUsage
    };
  }

  /**
   * Inicia la limpieza automática de elementos expirados
   */
  private startCleanup(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, intervalMs);
  }

  /**
   * Limpia elementos expirados del cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired items`);
    }
  }

  /**
   * Detiene la limpieza automática
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}