import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Brain, Gem, Zap, Waves, Info, ExternalLink } from "lucide-react";
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

  // Update localKeys when apiKeys changes (e.g., after loading from server)
  useEffect(() => {
    setLocalKeys(apiKeys);
  }, [apiKeys]);
  const [testing, setTesting] = useState(false);

  const toggleVisibility = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider as keyof typeof prev]
    }));
  };

  const handleSave = async () => {
    try {
      await updateApiKeys(localKeys);
      toast({
        title: "API Keys Saved",
        description: "Your API keys have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive",
      });
    }
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
      label: "OpenAI API Key (via OpenRouter)",
      placeholder: "sk-or-v1-...",
      icon: Brain,
      color: "text-green-600",
      model: "openai/gpt-oss-20b:free"
    },
    {
      key: "gemini",
      label: "Google Gemini API Key",
      placeholder: "AIzaSy...",
      icon: Gem,
      color: "text-blue-600",
      model: "gemini-1.5-flash"
    },
    {
      key: "grok",
      label: "Grok API Key (via OpenRouter)",
      placeholder: "sk-or-v1-...",
      icon: Zap,
      color: "text-purple-600",
      model: "x-ai/grok-4-fast:free"
    },
    {
      key: "deepseek",
      label: "DeepSeek API Key (via OpenRouter)",
      placeholder: "sk-or-v1-...",
      icon: Waves,
      color: "text-teal-600",
      model: "deepseek/deepseek-chat-v3.1:free"
    },
  ];

  return (
    <section className="p-6">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-2xl font-semibold">API Settings</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Configure your AI API keys below. These are securely stored in your account for easy access.
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

        {/* API Key Information Section */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">How to Get API Keys</h3>
            </div>
            
            <div className="space-y-6">
              {/* OpenRouter Section */}
              <div className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium flex items-center space-x-2">
                    <span>OpenRouter (Free AI Models)</span>
                    <a 
                      href="https://openrouter.ai" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Get free access to OpenAI, Grok, and DeepSeek models through OpenRouter.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-green-600" />
                    <span className="font-medium">OpenAI GPT-OSS-20B:</span>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">sk-or-v1-xxxxxxxx...</code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Grok 4 Fast:</span>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">sk-or-v1-xxxxxxxx...</code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Waves className="h-4 w-4 text-teal-600" />
                    <span className="font-medium">DeepSeek V3.1:</span>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">sk-or-v1-xxxxxxxx...</code>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>1. Sign up at <strong>openrouter.ai</strong></p>
                  <p>2. Get $1 free credits upon signup</p>
                  <p>3. Create your API key in the Keys section</p>
                  <p>4. Copy the key (starts with sk-or-v1-...)</p>
                </div>
              </div>

              {/* Google AI Studio Section */}
              <div className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium flex items-center space-x-2">
                    <span>Google AI Studio (Gemini)</span>
                    <a 
                      href="https://ai.google.dev" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Free access to Google's Gemini AI models.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Gem className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Gemini 1.5 Flash:</span>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">AIzaSy...</code>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>1. Go to <strong>ai.google.dev</strong></p>
                  <p>2. Sign in with your Google account</p>
                  <p>3. Click "Get API Key" → "Create API Key"</p>
                  <p>4. Copy the key (starts with AIzaSy...)</p>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-sm">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Security Note</p>
                    <p className="text-blue-800 dark:text-blue-200 mt-1">
                      API keys are stored temporarily in your browser session and are never sent to our servers permanently. 
                      Clear your browser data to remove stored keys.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
