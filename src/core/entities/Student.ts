// src/core/entities/Student.ts
export class Student {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly grade: string,
    public readonly course: string,
    public readonly active: boolean
  ) {
    // Validaciones básicas
    if (!id) throw new Error('Student ID is required');
    if (!username) throw new Error('Student username is required');
    if (!firstName) throw new Error('Student first name is required');
    if (!lastName) throw new Error('Student last name is required');
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  canVote(): boolean {
    return this.active;
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