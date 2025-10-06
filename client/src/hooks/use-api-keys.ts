import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";

interface ApiKeys {
  openai?: string;
  gemini?: string;
  grok?: string;
  deepseek?: string;
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadApiKeys();
    } else {
      // Fall back to session storage for unauthenticated users
      const stored = sessionStorage.getItem("studyapp-api-keys");
      if (stored) {
        try {
          setApiKeys(JSON.parse(stored));
        } catch (error) {
          console.error("Failed to parse stored API keys:", error);
        }
      }
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadApiKeys = async () => {
    try {
      // Get actual keys directly for use
      const response = await fetch('/api/keys/actual', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded API keys from server:', data);
        if (data.success) {
          setApiKeys(data.apiKeys || {});
        }
      } else {
        console.error('Failed to load API keys, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApiKeys = async (newKeys: ApiKeys) => {
    console.log('Updating API keys:', newKeys);
    if (isAuthenticated) {
      try {
        const response = await fetch('/api/keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(newKeys),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Save API keys response:', data);
          if (data.success) {
            setApiKeys(newKeys);
            // Reload keys to make sure they're saved correctly
            await loadApiKeys();
            return true;
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to save API keys, status:', response.status, 'error:', errorText);
        }
        throw new Error('Failed to save API keys');
      } catch (error) {
        console.error('Failed to update API keys:', error);
        throw error;
      }
    } else {
      // Fall back to session storage for unauthenticated users
      setApiKeys(newKeys);
      sessionStorage.setItem("studyapp-api-keys", JSON.stringify(newKeys));
      return true;
    }
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
    loading,
  };
}
