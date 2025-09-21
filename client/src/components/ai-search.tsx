import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Copy, Brain, Gem, Zap, Waves } from "lucide-react";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface AIResponse {
  model: string;
  provider: string;
  content: string;
  icon: string;
  color: string;
  error?: boolean;
}

export default function AiSearch() {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const { apiKeys } = useApiKeys();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;

    const hasApiKeys = Object.values(apiKeys).some(key => key);
    if (!hasApiKeys) {
      toast({
        title: "No API Keys",
        description: "Please configure at least one API key in the API Settings section.",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      const result = await api.queryAI(query, apiKeys);
      setResponses(result.responses);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to get AI responses. Please check your API keys.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleCopyToNotes = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Response copied to clipboard. You can paste it into your notes.",
    });
  };

  const getIcon = (iconName: string) => {
    const icons = {
      brain: Brain,
      gem: Gem,
      bolt: Zap,
      water: Waves,
    };
    return icons[iconName as keyof typeof icons] || Brain;
  };

  const getColorClass = (color: string) => {
    const colors = {
      green: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
      purple: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
      teal: "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400",
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <section className="p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-semibold">AI Study Assistant</h2>
          <p className="text-muted-foreground">
            Ask questions and get responses from multiple AI models to enhance your understanding.
          </p>
        </div>

        {/* Search Input */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your studies..."
                className="min-h-24 resize-none pr-16"
                data-testid="textarea-ai-query"
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="absolute bottom-3 right-3"
                data-testid="button-ask-ai"
              >
                <Send className="mr-2 h-4 w-4" />
                {searching ? "Asking..." : "Ask AI"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Responses */}
        {responses.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {responses.map((response, index) => {
              const IconComponent = getIcon(response.icon);
              return (
                <Card 
                  key={index} 
                  className={`ai-response-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    response.error ? "border-destructive" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getColorClass(response.color)}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <h3 className="font-medium">{response.model}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToNotes(response.content)}
                        data-testid={`button-copy-${response.provider}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className={`prose prose-sm max-w-none ${response.error ? "text-destructive" : ""}`}>
                      {response.content.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-2 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {responses.length === 0 && !searching && (
          <Card>
            <CardContent className="flex h-64 items-center justify-center p-6">
              <div className="text-center">
                <h3 className="mb-2 text-lg font-medium">No Searches Yet</h3>
                <p className="text-muted-foreground">
                  Ask a question above to get responses from multiple AI models.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
