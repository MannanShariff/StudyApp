import { useState } from "react";
import { Moon, Sun, Settings, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AboutSection from "@/components/about-section";
import ApiSettings from "@/components/api-settings";
import NotesSection from "@/components/notes-section";
import AiSearch from "@/components/ai-search";
import ExplanationSidebar from "@/components/explanation-sidebar";

const sections = [
  { id: "about", label: "About", icon: "info-circle" },
  { id: "api-settings", label: "API Settings", icon: "key" },
  { id: "notes", label: "Notes", icon: "sticky-note" },
  { id: "ai-search", label: "AI Search", icon: "search" },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState("about");
  const [isDark, setIsDark] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleTextSelection = (text: string, explanationText: string) => {
    setSelectedText(text);
    setExplanation(explanationText);
    setIsExplanationOpen(true);
  };

  const closeExplanation = () => {
    setIsExplanationOpen(false);
    setSelectedText("");
    setExplanation("");
  };

  const renderIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      "info-circle": "fas fa-info-circle",
      "key": "fas fa-key",
      "sticky-note": "fas fa-sticky-note",
      "search": "fas fa-search",
    };
    return <i className={`${iconMap[iconName]} text-xs`} />;
  };

  const renderSection = () => {
    switch (activeSection) {
      case "about":
        return <AboutSection />;
      case "api-settings":
        return <ApiSettings />;
      case "notes":
        return <NotesSection onTextSelection={handleTextSelection} />;
      case "ai-search":
        return <AiSearch />;
      default:
        return <AboutSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-semibold">StudyApp</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="secondary" 
              size="sm"
              className="flex items-center space-x-2"
              data-testid="button-settings"
            >
              <Settings className="h-3 w-3" />
              <span>Settings</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-background p-6">
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-${section.id}`}
              >
                {renderIcon(section.icon)}
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderSection()}
        </main>

        {/* Explanation Sidebar */}
        <ExplanationSidebar
          isOpen={isExplanationOpen}
          selectedText={selectedText}
          explanation={explanation}
          onClose={closeExplanation}
        />
      </div>
    </div>
  );
}
