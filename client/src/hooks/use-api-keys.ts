import { useState, useEffect } from "react";

interface ApiKeys {
  openai?: string;
  gemini?: string;
  grok?: string;
  deepseek?: string;
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});

  useEffect(() => {
    // Load API keys from session storage on mount
    const stored = sessionStorage.getItem("studyapp-api-keys");
    if (stored) {
      try {
        setApiKeys(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse stored API keys:", error);
      }
    }
  }, []);

  const updateApiKeys = (newKeys: ApiKeys) => {
    setApiKeys(newKeys);
    sessionStorage.setItem("studyapp-api-keys", JSON.stringify(newKeys));
  };

  const testConnection = async (keys: ApiKeys): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {};
    
    // Simple test query
    const testQuery = "Hello, can you respond with 'OK'?";
    
    try {
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: testQuery,
          apiKeys: keys,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        data.responses.forEach((resp: any) => {
          results[resp.provider] = !resp.error;
        });
      }
    } catch (error) {
      console.error("Connection test failed:", error);
    }
    
    return results;
  };

  return {
    apiKeys,
    updateApiKeys,
    testConnection,
  };
}
