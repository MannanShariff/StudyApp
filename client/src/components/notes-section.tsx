import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";
import NotesEditor from "./notes-editor";
import { api } from "@/lib/api";
import type { Note } from "@shared/schema";

interface NotesSectionProps {
  onTextSelection: (text: string, explanation: string) => void;
}

export default function NotesSection({ onTextSelection }: NotesSectionProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const selectedNote = notes.find((note: Note) => note.id === selectedNoteId);

  const handleCreateNote = async () => {
    try {
      const newNote = await api.createNote({
        title: "Untitled Note",
        content: ""
      });
      setSelectedNoteId(newNote.id);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleUploadPdf = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // PDF upload functionality would be implemented here
        console.log("PDF uploaded:", file.name);
      }
    };
    input.click();
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <section className="p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Notes</h2>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleUploadPdf}
              data-testid="button-upload-pdf"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload PDF
            </Button>
            <Button 
              onClick={handleCreateNote}
              data-testid="button-create-note"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Note
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Notes List */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-4 font-medium">All Notes</h3>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet. Create your first note!</p>
                ) : (
                  <div className="space-y-2">
                    {notes.map((note: Note) => (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNoteId(note.id)}
                        className={`cursor-pointer rounded-lg p-3 transition-colors ${
                          selectedNoteId === note.id
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-secondary"
                        }`}
                        data-testid={`note-item-${note.id}`}
                      >
                        <h4 className="text-sm font-medium line-clamp-1">
                          {note.title || "Untitled"}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes Editor */}
          <div className="lg:col-span-3">
            {selectedNote ? (
              <NotesEditor
                note={selectedNote}
                onTextSelection={onTextSelection}
                onUpdate={() => {
                  // Refresh notes list
                }}
              />
            ) : (
              <Card>
                <CardContent className="flex h-96 items-center justify-center p-6">
                  <div className="text-center">
                    <h3 className="mb-2 text-lg font-medium">No Note Selected</h3>
                    <p className="text-muted-foreground">
                      Select a note from the sidebar or create a new one to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
