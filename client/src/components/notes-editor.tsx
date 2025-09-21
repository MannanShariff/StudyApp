import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Download,
  Trash2
} from "lucide-react";
import { api } from "@/lib/api";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@shared/schema";
import jsPDF from "jspdf";

interface NotesEditorProps {
  note: Note;
  onTextSelection: (text: string, explanation: string) => void;
  onUpdate: () => void;
}

export default function NotesEditor({ note, onTextSelection, onUpdate }: NotesEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const { apiKeys } = useApiKeys();
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateNote(note.id, { title, content });
      onUpdate();
      toast({
        title: "Note Saved",
        description: "Your note has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save your note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await api.deleteNote(note.id);
        onUpdate();
        toast({
          title: "Note Deleted",
          description: "Your note has been deleted.",
        });
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Failed to delete the note. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      try {
        const explanation = await api.explainText(selectedText, apiKeys);
        onTextSelection(selectedText, explanation);
      } catch (error) {
        toast({
          title: "Explanation Failed",
          description: "Failed to get AI explanation. Check your API settings.",
          variant: "destructive",
        });
      }
    }
  };

  const handleExportPdf = () => {
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, 20, 30);
    
    // Add content
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    
    // Split content into lines that fit the page width
    const lines = pdf.splitTextToSize(content, 170);
    pdf.text(lines, 20, 50);
    
    // Save the PDF
    pdf.save(`${title || 'note'}.pdf`);
    
    toast({
      title: "PDF Exported",
      description: "Your note has been exported as a PDF.",
    });
  };

  const formatText = (command: string) => {
    if (contentRef.current) {
      const textarea = contentRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        let formattedText = selectedText;
        switch (command) {
          case "bold":
            formattedText = `**${selectedText}**`;
            break;
          case "italic":
            formattedText = `*${selectedText}*`;
            break;
          case "underline":
            formattedText = `__${selectedText}__`;
            break;
        }
        
        const newContent = content.substring(0, start) + formattedText + content.substring(end);
        setContent(newContent);
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Editor Header */}
        <div className="border-b border-border p-4">
          <div className="mb-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="border-0 bg-transparent text-xl font-semibold placeholder:text-muted-foreground focus-visible:ring-0"
              data-testid="input-note-title"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText("bold")}
                data-testid="button-bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText("italic")}
                data-testid="button-italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText("underline")}
                data-testid="button-underline"
              >
                <Underline className="h-4 w-4" />
              </Button>
              <div className="mx-2 h-4 w-px bg-border" />
              <Button
                variant="ghost"
                size="sm"
                data-testid="button-list"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-testid="button-ordered-list"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPdf}
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                data-testid="button-delete-note"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                data-testid="button-save-note"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="p-6">
          <Textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onMouseUp={handleTextSelection}
            placeholder="Start writing your note..."
            className="min-h-96 resize-none border-0 p-0 text-base focus-visible:ring-0"
            data-testid="textarea-note-content"
          />
        </div>
      </CardContent>
    </Card>
  );
}
