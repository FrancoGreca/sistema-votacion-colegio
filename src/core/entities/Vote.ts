// src/core/entities/Vote.ts
export class Vote {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly candidateId: string,
    public readonly month: string,
    public readonly year: number,
    public readonly timestamp: Date = new Date()
  ) {
    // Validaciones básicas
    if (!id) throw new Error('Vote ID is required');
    if (!studentId) throw new Error('Student ID is required');
    if (!candidateId) throw new Error('Candidate ID is required');
    if (!month) throw new Error('Month is required');
    if (!year || year < 2020) throw new Error('Valid year is required');
  }

  get voteKey(): string {
    return `${this.studentId}-${this.month}-${this.year}`;
  }

  isFromPeriod(month: string, year: number): boolean {
    return this.month === month && this.year === year;
  }
}