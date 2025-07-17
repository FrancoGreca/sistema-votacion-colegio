// src/core/utils/DateUtils.ts
export class DateUtils {
  static getCurrentMonth(): string {
    return new Date().toLocaleString('es', { month: 'long' });
  }

  static getCurrentYear(): number {
    return new Date().getFullYear();
  }

  static getMonthNames(): string[] {
    return [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
  }

  static isValidMonth(month: string): boolean {
    return this.getMonthNames().includes(month.toLowerCase());
  }

  static isValidYear(year: number): boolean {
    const currentYear = this.getCurrentYear();
    return year >= 2020 && year <= currentYear + 1;
  }
}

// src/core/utils/IdGenerator.ts
export class IdGenerator {
  static generate(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  static generateVoteId(studentId: string, candidateId: string, month: string, year: number): string {
    return `vote-${studentId}-${candidateId}-${month}-${year}`;
  }
}