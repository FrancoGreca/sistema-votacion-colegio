// src/infrastructure/external/airtable/AirtableClient.ts

export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime?: string;
}

export interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface AirtableRequestOptions {
  filterByFormula?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  maxRecords?: number;
  view?: string;
}

export class AirtableClient {
  private apiKey: string;
  private baseId: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || '';
    this.baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || '';

    if (!this.apiKey || !this.baseId) {
      console.warn('Airtable credentials not configured, using demo mode');
    }
  }

  private buildUrl(table: string, options?: AirtableRequestOptions): string {
    const baseUrl = `https://api.airtable.com/v0/${this.baseId}/${table}`;
    const params = new URLSearchParams();

    if (options?.filterByFormula) {
      params.append('filterByFormula', options.filterByFormula);
    }

    if (options?.sort) {
      options.sort.forEach((sortOption, index) => {
        params.append(`sort[${index}][field]`, sortOption.field);
        params.append(`sort[${index}][direction]`, sortOption.direction);
      });
    }

    if (options?.maxRecords) {
      params.append('maxRecords', options.maxRecords.toString());
    }

    if (options?.view) {
      params.append('view', options.view);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getRecords(table: string, options?: AirtableRequestOptions): Promise<AirtableRecord[]> {
    if (!this.isConfigured()) {
      throw new Error('Airtable not configured');
    }

    try {
      const url = this.buildUrl(table, options);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data: AirtableResponse = await response.json();
      return data.records;
    } catch (error) {
      console.error(`Error fetching records from ${table}:`, error);
      throw error;
    }
  }

  async getRecord(table: string, recordId: string): Promise<AirtableRecord | null> {
    if (!this.isConfigured()) {
      throw new Error('Airtable not configured');
    }

    try {
      const url = `https://api.airtable.com/v0/${this.baseId}/${table}/${recordId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching record ${recordId} from ${table}:`, error);
      throw error;
    }
  }

  async createRecord(table: string, fields: Record<string, any>): Promise<AirtableRecord> {
    if (!this.isConfigured()) {
      throw new Error('Airtable not configured');
    }

    try {
      const url = `https://api.airtable.com/v0/${this.baseId}/${table}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error creating record in ${table}:`, error);
      throw error;
    }
  }

  async updateRecord(table: string, recordId: string, fields: Record<string, any>): Promise<AirtableRecord> {
    if (!this.isConfigured()) {
      throw new Error('Airtable not configured');
    }

    try {
      const url = `https://api.airtable.com/v0/${this.baseId}/${table}/${recordId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating record ${recordId} in ${table}:`, error);
      throw error;
    }
  }

  async deleteRecord(table: string, recordId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Airtable not configured');
    }

    try {
      const url = `https://api.airtable.com/v0/${this.baseId}/${table}/${recordId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting record ${recordId} from ${table}:`, error);
      throw error;
    }
  }

  async deleteRecords(table: string, recordIds: string[]): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Airtable not configured');
    }

    // Airtable permite eliminar hasta 10 registros por vez
    const batchSize = 10;
    for (let i = 0; i < recordIds.length; i += batchSize) {
      const batch = recordIds.slice(i, i + batchSize);
      
      try {
        const url = `https://api.airtable.com/v0/${this.baseId}/${table}`;
        const queryParams = batch.map(id => `records[]=${id}`).join('&');
        
        const response = await fetch(`${url}?${queryParams}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Error deleting batch of records from ${table}:`, error);
        throw error;
      }
    }
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.baseId && 
              this.apiKey !== 'DEMO_MODE' && 
              this.baseId !== 'DEMO_MODE');
  }

  isDemoMode(): boolean {
    return !this.isConfigured();
  }
}