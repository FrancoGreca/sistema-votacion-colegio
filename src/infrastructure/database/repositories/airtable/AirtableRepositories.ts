// src/infrastructure/database/repositories/airtable/AirtableStudentRepository.ts
import { IStudentRepository } from '../../../../core/interfaces/repositories/IRepositories';
import { Student } from '../../../../core/entities/Student';
import { AirtableClient } from '../../../external/airtable/AirtableClient';

export class AirtableStudentRepository implements IStudentRepository {
  constructor(private airtableClient: AirtableClient) {}

  async findById(id: string): Promise<Student | null> {
    try {
      const record = await this.airtableClient.getRecord('Students', id);
      if (!record) return null;

      return new Student(
        record.id,
        record.fields.Username as string || '',
        record.fields.Nombre as string || '',
        record.fields.Apellido as string || '',
        record.fields.Grado as string || '',
        record.fields.Curso as string || '',
        record.fields.Active as boolean || false
      );
    } catch (error) {
      console.error('Error finding student by ID:', error);
      return null;
    }
  }

  async findByUsername(username: string): Promise<Student | null> {
    try {
      const records = await this.airtableClient.getRecords('Students', {
        filterByFormula: `{Username} = "${username}"`,
        maxRecords: 1
      });

      if (records.length === 0) return null;

      const record = records[0];
      return new Student(
        record.id,
        record.fields.Username as string || '',
        record.fields.Nombre as string || '',
        record.fields.Apellido as string || '',
        record.fields.Grado as string || '',
        record.fields.Curso as string || '',
        record.fields.Active as boolean || false
      );
    } catch (error) {
      console.error('Error finding student by username:', error);
      return null;
    }
  }

  async findByCredentials(username: string, password: string): Promise<Student | null> {
    try {
      const filterFormula = `AND({Username} = "${username}", {Password} = "${password}", {Active} = TRUE())`;
      const records = await this.airtableClient.getRecords('Students', {
        filterByFormula,
        maxRecords: 1
      });

      if (records.length === 0) return null;

      const record = records[0];
      return new Student(
        record.id,
        record.fields.Username as string || '',
        record.fields.Nombre as string || '',
        record.fields.Apellido as string || '',
        record.fields.Grado as string || '',
        record.fields.Curso as string || '',
        record.fields.Active as boolean || false
      );
    } catch (error) {
      console.error('Error finding student by credentials:', error);
      return null;
    }
  }

  async findAll(): Promise<Student[]> {
    try {
      const records = await this.airtableClient.getRecords('Students', {
        filterByFormula: '{Active} = TRUE()',
        sort: [{ field: 'Apellido', direction: 'asc' }]
      });

      return records.map(record => new Student(
        record.id,
        record.fields.Username as string || '',
        record.fields.Nombre as string || '',
        record.fields.Apellido as string || '',
        record.fields.Grado as string || '',
        record.fields.Curso as string || '',
        record.fields.Active as boolean || false
      ));
    } catch (error) {
      console.error('Error finding all students:', error);
      return [];
    }
  }

  async findByGradeAndCourse(grade: string, course: string): Promise<Student[]> {
    try {
      const filterFormula = `AND({Grado} = "${grade}", {Curso} = "${course}", {Active} = TRUE())`;
      const records = await this.airtableClient.getRecords('Students', {
        filterByFormula,
        sort: [{ field: 'Apellido', direction: 'asc' }]
      });

      return records.map(record => new Student(
        record.id,
        record.fields.Username as string || '',
        record.fields.Nombre as string || '',
        record.fields.Apellido as string || '',
        record.fields.Grado as string || '',
        record.fields.Curso as string || '',
        record.fields.Active as boolean || false
      ));
    } catch (error) {
      console.error('Error finding students by grade and course:', error);
      return [];
    }
  }
}

// src/infrastructure/database/repositories/airtable/AirtableCandidateRepository.ts
import { ICandidateRepository } from '../../../../core/interfaces/repositories/IRepositories';
import { Candidate } from '../../../../core/entities/Candidate';
import { AirtableClient } from '../../../external/airtable/AirtableClient';

export class AirtableCandidateRepository implements ICandidateRepository {
  constructor(private airtableClient: AirtableClient) {}

  async findAll(): Promise<Candidate[]> {
    try {
      const records = await this.airtableClient.getRecords('Candidates', {
        sort: [{ field: 'Apellido', direction: 'asc' }]
      });

      return records.map(record => new Candidate(
        record.id,
        record.fields.Nombre as string || '',
        record.fields.Apellido as string || '',
        record.fields.Grado as string || '',
        record.fields.Curso as string || ''
      ));
    } catch (error) {
      console.error('Error finding all candidates:', error);
      return [];
    }
  }

  async findById(id: string): Promise<Candidate | null> {
    try {
      const record = await this.airtableClient.getRecord('Candidates', id);
      if (!record) return null;

      return new Candidate(
        record.id,
        record.fields.Nombre as string || '',
        record.fields.Apellido as string || '',
        record.fields.Grado as string || '',
        record.fields.Curso as string || ''
      );
    } catch (error) {
      console.error('Error finding candidate by ID:', error);
      return null;
    }
  }

  async findByGradeAndCourse(grade: string, course: string): Promise<Candidate[]> {
    try {
      const filterFormula = `AND({Grado} = "${grade}", {Curso} = "${course}")`;
      const records = await this.airtableClient.getRecords('Candidates', {
        filterByFormula,
        sort: [{ field: 'Apellido', direction: 'asc' }]
      });

      return records.map(record => new Candidate(
        record.id,
        record.fields.Nombre as string || '',
        record.fields.Apellido as string || '',
        record.fields.Grado as string || '',
        record.fields.Curso as string || ''
      ));
    } catch (error) {
      console.error('Error finding candidates by grade and course:', error);
      return [];
    }
  }

  async findActive(): Promise<Candidate[]> {
    try {
      const records = await this.airtableClient.getRecords('Candidates', {
        filterByFormula: '{Active} = TRUE()',
        sort: [{ field: 'Apellido', direction: 'asc' }]
      });

      return records.map(record => new Candidate(
        record.id,
        record.fields.Nombre as string || '',
        record.fields.Apellido as string || '',
        record.fields.Grado as string || '',
        record.fields.Curso as string || ''
      ));
    } catch (error) {
      console.error('Error finding active candidates:', error);
      return [];
    }
  }
}

// src/infrastructure/database/repositories/airtable/AirtableVoteRepository.ts
import { IVoteRepository } from '../../../../core/interfaces/repositories/IRepositories';
import { Vote } from '../../../../core/entities/Vote';
import { AirtableClient } from '../../../external/airtable/AirtableClient';
import { IdGenerator } from '../../../../core/utils/CoreUtils';

export class AirtableVoteRepository implements IVoteRepository {
  constructor(private airtableClient: AirtableClient) {}

  async save(vote: Vote): Promise<void> {
    try {
      await this.airtableClient.createRecord('Votes', {
        VoteId: vote.id,
        StudentId: vote.studentId,
        CandidateId: vote.candidateId,
        Mes: vote.month,
        Ano: vote.year,
        Timestamp: vote.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Error saving vote:', error);
      throw error;
    }
  }

  async findByPeriod(month: string, year: number): Promise<Vote[]> {
    try {
      const filterFormula = `AND({Mes} = "${month}", {Ano} = ${year})`;
      const records = await this.airtableClient.getRecords('Votes', {
        filterByFormula,
        sort: [{ field: 'Timestamp', direction: 'desc' }]
      });

      return records.map(record => new Vote(
        record.fields.VoteId as string || record.id,
        record.fields.StudentId as string || '',
        record.fields.CandidateId as string || '',
        record.fields.Mes as string || '',
        record.fields.Ano as number || 0,
        new Date(record.fields.Timestamp as string || Date.now())
      ));
    } catch (error) {
      console.error('Error finding votes by period:', error);
      return [];
    }
  }

  async findByStudent(studentId: string, month: string, year: number): Promise<Vote | null> {
    try {
      const filterFormula = `AND({StudentId} = "${studentId}", {Mes} = "${month}", {Ano} = ${year})`;
      const records = await this.airtableClient.getRecords('Votes', {
        filterByFormula,
        maxRecords: 1
      });

      if (records.length === 0) return null;

      const record = records[0];
      return new Vote(
        record.fields.VoteId as string || record.id,
        record.fields.StudentId as string || '',
        record.fields.CandidateId as string || '',
        record.fields.Mes as string || '',
        record.fields.Ano as number || 0,
        new Date(record.fields.Timestamp as string || Date.now())
      );
    } catch (error) {
      console.error('Error finding vote by student:', error);
      return null;
    }
  }

  async findByStudentUsername(username: string, month: string, year: number): Promise<Vote | null> {
    try {
      const filterFormula = `AND({StudentUsername} = "${username}", {Mes} = "${month}", {Ano} = ${year})`;
      const records = await this.airtableClient.getRecords('Votes', {
        filterByFormula,
        maxRecords: 1
      });

      if (records.length === 0) return null;

      const record = records[0];
      return new Vote(
        record.fields.VoteId as string || record.id,
        record.fields.StudentUsername as string || '', // Para compatibilidad
        record.fields.CandidateId as string || '',
        record.fields.Mes as string || '',
        record.fields.Ano as number || 0,
        new Date(record.fields.Timestamp as string || Date.now())
      );
    } catch (error) {
      console.error('Error finding vote by student username:', error);
      return null;
    }
  }

  async countByCandidate(month: string, year: number): Promise<Map<string, number>> {
    try {
      const votes = await this.findByPeriod(month, year);
      const counts = new Map<string, number>();

      votes.forEach(vote => {
        const current = counts.get(vote.candidateId) || 0;
        counts.set(vote.candidateId, current + 1);
      });

      return counts;
    } catch (error) {
      console.error('Error counting votes by candidate:', error);
      return new Map();
    }
  }

  async deleteByPeriod(month: string, year: number): Promise<void> {
    try {
      const filterFormula = `AND({Mes} = "${month}", {Ano} = ${year})`;
      const records = await this.airtableClient.getRecords('Votes', {
        filterByFormula
      });

      const recordIds = records.map(record => record.id);
      if (recordIds.length > 0) {
        await this.airtableClient.deleteRecords('Votes', recordIds);
      }
    } catch (error) {
      console.error('Error deleting votes by period:', error);
      throw error;
    }
  }
}