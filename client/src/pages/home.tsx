import { useState } from "react";
import { Moon, Sun, GraduationCap, LogOut, User, Menu, X, Info, Key, StickyNote, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
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
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const [selectedText, setSelectedText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [currentAppendFunction, setCurrentAppendFunction] = useState<((text: string) => void) | null>(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTextSelection = (text: string, explanationText: string, appendToNote?: (text: string) => void) => {
    setSelectedText(text);
    setExplanation(explanationText);
    setCurrentAppendFunction(() => appendToNote || null);
    setIsExplanationOpen(true);
  };

  const closeExplanation = () => {
    setIsExplanationOpen(false);
    setSelectedText("");
    setExplanation("");
    setCurrentAppendFunction(null);
  };

  const renderIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      "info-circle": Info,
      "key": Key,
      "sticky-note": StickyNote,
      "search": Search,
    };
    const IconComponent = iconMap[iconName] || Info;
    return <IconComponent className="h-4 w-4" />;
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
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              title={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-semibold">StudyApp</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Welcome, {user?.username}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 transform border-r border-border bg-background transition-all duration-300 ease-in-out",
          "md:relative md:z-auto",
          isSidebarOpen 
            ? "w-64 p-6 translate-x-0" 
            : "-translate-x-full md:translate-x-0 md:w-16 md:px-2 md:py-6"
        )}>
          {/* App logo in collapsed state */}
          {!isSidebarOpen && (
            <div className="hidden md:flex justify-center pt-4 pb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
          )}
          
          <nav className={cn(
            "space-y-2 mt-16 md:mt-0",
            !isSidebarOpen && "md:flex md:flex-col md:items-center md:mt-0"
          )}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors group relative",
                  isSidebarOpen
                    ? "w-full space-x-3 px-3 py-2"
                    : "w-full justify-center px-2 py-2 md:w-12 md:h-12",
                  activeSection === section.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-${section.id}`}
                title={!isSidebarOpen ? section.label : undefined}
              >
                {renderIcon(section.icon)}
                {isSidebarOpen && <span>{section.label}</span>}
                
                {/* Tooltip for collapsed state */}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 hidden md:block">
                    {section.label}
                  </div>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-in-out",
          !isSidebarOpen && "md:ml-0"
        )}>
          {renderSection()}
        </main>

        {/* Explanation Sidebar */}
        <ExplanationSidebar
          isOpen={isExplanationOpen}
          selectedText={selectedText}
          explanation={explanation}
          onClose={closeExplanation}
          onAddToNote={currentAppendFunction}
        />
      </div>
    </div>
  );
}
