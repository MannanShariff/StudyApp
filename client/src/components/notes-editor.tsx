import { useState, useRef, useEffect } from "react";
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
  Trash2,
  HelpCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@shared/schema";
import jsPDF from "jspdf";

interface NotesEditorProps {
  note: Note;
  onTextSelection: (text: string, explanation: string, appendToNote?: (text: string) => void) => void;
  onUpdate: () => void;
}

export default function NotesEditor({ note, onTextSelection, onUpdate }: NotesEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showExplanationButton, setShowExplanationButton] = useState(false);
  const [gettingExplanation, setGettingExplanation] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const { apiKeys } = useApiKeys();
  const { toast } = useToast();

  // Function to append text to current content
  const appendToNote = (text: string) => {
    setContent(prevContent => {
      const separator = prevContent.trim() ? "\n\n" : "";
      return prevContent + separator + text;
    });
  };

  // Sync local state when note prop changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);

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

  const handleTextSelection = () => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const selected = selection?.toString().trim();
      
      console.log('Text selection detected:', selected);
      
      if (selected && selected.length > 3) { // Minimum 3 characters for explanation
        setSelectedText(selected);
        setShowExplanationButton(true);
        console.log('Showing explanation button for:', selected.substring(0, 50) + '...');
      } else {
        setSelectedText("");
        setShowExplanationButton(false);
      }
    }, 100);
  };

  const handleExplainText = async () => {
    if (!selectedText) {
      console.log('No text selected for explanation');
      return;
    }
    
    console.log('Getting explanation for:', selectedText.substring(0, 100) + '...');
    console.log('Using API keys:', Object.keys(apiKeys).filter(key => apiKeys[key as keyof typeof apiKeys]));
    
    setGettingExplanation(true);
    try {
      const explanation = await api.explainText(selectedText, apiKeys);
      console.log('Received explanation:', explanation.substring(0, 100) + '...');
      onTextSelection(selectedText, explanation, appendToNote);
      setShowExplanationButton(false);
      setSelectedText("");
      toast({
        title: "Explanation Generated",
        description: "AI explanation has been generated successfully.",
      });
    } catch (error) {
      console.error('Explanation failed:', error);
      toast({
        title: "Explanation Failed",
        description: error instanceof Error ? error.message : "Failed to get AI explanation. Check your API settings.",
        variant: "destructive",
      });
    } finally {
      setGettingExplanation(false);
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
        <div className="relative p-8">
          <Textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={handleTextSelection}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="Start writing your note..."
            className="min-h-[600px] resize-none border-0 p-0 text-lg leading-relaxed focus-visible:ring-0 font-serif"
            data-testid="textarea-note-content"
          />
          
          {/* Floating Explanation Button */}
          {showExplanationButton && (
            <div className="fixed bottom-6 right-6 z-50">
              <Button
                onClick={handleExplainText}
                disabled={gettingExplanation}
                className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                data-testid="button-explain-text"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                {gettingExplanation ? "Getting Explanation..." : "Explain Selected Text"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
