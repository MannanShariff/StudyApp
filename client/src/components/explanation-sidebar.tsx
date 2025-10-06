import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExplanationSidebarProps {
  isOpen: boolean;
  selectedText: string;
  explanation: string;
  onClose: () => void;
  onAddToNote?: (text: string) => void;
}

export default function ExplanationSidebar({ 
  isOpen, 
  selectedText, 
  explanation, 
  onClose,
  onAddToNote
}: ExplanationSidebarProps) {
  const handleAddToNotes = () => {
    const formattedText = `**Selected Text:** ${selectedText}\n\n**Explanation:** ${explanation}`;
    
    if (onAddToNote) {
      onAddToNote(formattedText);
      onClose();
    } else {
      // Fallback to clipboard copy
      navigator.clipboard.writeText(formattedText);
      onClose();
    }
  };

  return (
    <aside 
      className={cn(
        "fixed right-0 top-16 z-40 h-[calc(100vh-4rem)] w-80 border-l border-border bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
      data-testid="explanation-sidebar"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">AI Explanation</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          data-testid="button-close-explanation"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mb-4 rounded-lg bg-secondary p-3">
        <p className="text-sm font-medium">Selected Text:</p>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="text-selected">
          {selectedText}
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Brain className="h-3 w-3" />
              </div>
              <span className="text-sm font-medium">AI Explanation</span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-explanation">
              {explanation}
            </p>
          </CardContent>
        </Card>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleAddToNotes}
          data-testid="button-add-explanation-to-notes"
        >
          <Plus className="mr-2 h-3 w-3" />
          Add to Notes
        </Button>
      </div>
    </aside>
  );
}
