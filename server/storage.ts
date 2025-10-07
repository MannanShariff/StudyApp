import { type User, type InsertUser, type Note, type InsertNote } from "../shared/schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getNotes(userId: string): Promise<Note[]>;
  getNote(id: string, userId: string): Promise<Note | undefined>;
  createNote(note: InsertNote & { userId: string }): Promise<Note>;
  updateNote(id: string, userId: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private notes: Map<string, Note>;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getNotes(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getNote(id: string, userId: string): Promise<Note | undefined> {
    const note = this.notes.get(id);
    return (note && note.userId === userId) ? note : undefined;
  }

  async createNote(insertNote: InsertNote & { userId: string }): Promise<Note> {
    const id = randomUUID();
    const now = new Date();
    const note: Note = { 
      ...insertNote, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, userId: string, noteUpdate: Partial<InsertNote>): Promise<Note | undefined> {
    const existing = this.notes.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated: Note = {
      ...existing,
      ...noteUpdate,
      updatedAt: new Date()
    };
    this.notes.set(id, updated);
    return updated;
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    const existing = this.notes.get(id);
    if (!existing || existing.userId !== userId) return false;
    return this.notes.delete(id);
  }
}

export const storage = new MemStorage();
