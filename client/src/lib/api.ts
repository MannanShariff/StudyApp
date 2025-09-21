import { apiRequest } from "./queryClient";
import type { Note, InsertNote, AIRequest, ExplainTextRequest } from "@shared/schema";

export const api = {
  // Notes API
  async getNotes(): Promise<Note[]> {
    const response = await apiRequest("GET", "/api/notes");
    return response.json();
  },

  async getNote(id: string): Promise<Note> {
    const response = await apiRequest("GET", `/api/notes/${id}`);
    return response.json();
  },

  async createNote(note: InsertNote): Promise<Note> {
    const response = await apiRequest("POST", "/api/notes", note);
    return response.json();
  },

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note> {
    const response = await apiRequest("PUT", `/api/notes/${id}`, note);
    return response.json();
  },

  async deleteNote(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/notes/${id}`);
  },

  // AI API
  async queryAI(query: string, apiKeys: AIRequest['apiKeys']): Promise<{ responses: any[] }> {
    const response = await apiRequest("POST", "/api/ai/query", { query, apiKeys });
    return response.json();
  },

  async explainText(text: string, apiKeys: ExplainTextRequest['apiKeys']): Promise<string> {
    const response = await apiRequest("POST", "/api/ai/explain", { text, apiKeys });
    const result = await response.json();
    return result.explanation;
  },
};
