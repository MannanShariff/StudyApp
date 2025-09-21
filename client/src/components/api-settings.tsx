import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Brain, Gem, Zap, Waves } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApiKeys } from "@/hooks/use-api-keys";

export default function ApiSettings() {
  const { toast } = useToast();
  const { apiKeys, updateApiKeys, testConnection } = useApiKeys();
  const [showKeys, setShowKeys] = useState({
    openai: false,
    gemini: false,
    grok: false,
    deepseek: false,
  });
  const [localKeys, setLocalKeys] = useState(apiKeys);
  const [testing, setTesting] = useState(false);

  const toggleVisibility = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider as keyof typeof prev]
    }));
  };

  const handleSave = () => {
    updateApiKeys(localKeys);
    toast({
      title: "API Keys Saved",
      description: "Your API keys have been saved to session storage.",
    });
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const results = await testConnection(localKeys);
      const workingProviders = Object.entries(results)
        .filter(([_, working]) => working)
        .map(([provider]) => provider);
      
      if (workingProviders.length > 0) {
        toast({
          title: "Connection Test Results",
          description: `Working providers: ${workingProviders.join(", ")}`,
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: "No providers are working with the current API keys.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Test Error",
        description: "Failed to test API connections.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const providers = [
    {
      key: "openai",
      label: "OpenAI API Key",
      placeholder: "sk-...",
      icon: Brain,
      color: "text-green-600",
    },
    {
      key: "gemini",
      label: "Google Gemini API Key",
      placeholder: "AIza...",
      icon: Gem,
      color: "text-blue-600",
    },
    {
      key: "grok",
      label: "Grok API Key",
      placeholder: "xai-...",
      icon: Zap,
      color: "text-purple-600",
    },
    {
      key: "deepseek",
      label: "DeepSeek API Key",
      placeholder: "sk-...",
      icon: Waves,
      color: "text-teal-600",
    },
  ];

  return (
    <section className="p-6">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-2xl font-semibold">API Settings</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Configure your AI API keys below. These are stored temporarily in your session for security.
            </p>
            
            <div className="space-y-4">
              {providers.map((provider) => {
                const IconComponent = provider.icon;
                return (
                  <div key={provider.key} className="space-y-2">
                    <Label className="flex items-center text-sm font-medium">
                      <IconComponent className={`mr-2 h-4 w-4 ${provider.color}`} />
                      {provider.label}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showKeys[provider.key as keyof typeof showKeys] ? "text" : "password"}
                        placeholder={provider.placeholder}
                        value={localKeys[provider.key as keyof typeof localKeys] || ""}
                        onChange={(e) => setLocalKeys(prev => ({
                          ...prev,
                          [provider.key]: e.target.value
                        }))}
                        className="pr-10"
                        data-testid={`input-${provider.key}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                        onClick={() => toggleVisibility(provider.key)}
                        data-testid={`button-toggle-${provider.key}`}
                      >
                        {showKeys[provider.key as keyof typeof showKeys] ? 
                          <EyeOff className="h-4 w-4" /> : 
                          <Eye className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={handleTest}
                disabled={testing}
                data-testid="button-test-connection"
              >
                {testing ? "Testing..." : "Test Connection"}
              </Button>
              <Button 
                onClick={handleSave}
                data-testid="button-save-keys"
              >
                Save Keys
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
