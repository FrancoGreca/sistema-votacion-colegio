// src/core/entities/Candidate.ts
export class Candidate {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly grade: string,
    public readonly course: string
  ) {
    // Validaciones básicas
    if (!id) throw new Error('Candidate ID is required');
    if (!firstName) throw new Error('Candidate first name is required');
    if (!lastName) throw new Error('Candidate last name is required');
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Para compatibilidad con código actual
  get nombre(): string {
    return this.firstName;
  }

  get apellido(): string {
    return this.lastName;
  }

  get grado(): string {
    return this.grade;
  }

  get curso(): string {
    return this.course;
  }
}