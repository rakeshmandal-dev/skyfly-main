import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export function getActiveAIProvider() {
  const geminiKey =
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"];
  if (geminiKey) {
    const provider = createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: geminiKey,
    });
    return {
      providerName: "gemini" as const,
      modelName: "gemini-2.0-flash",
      model: provider("gemini-2.0-flash"),
    };
  }

  const openaiKey = process.env["OPENAI_API_KEY"];
  if (openaiKey) {
    const provider = createOpenAICompatible({
      name: "openai",
      baseURL: "https://api.openai.com/v1",
      apiKey: openaiKey,
    });
    return {
      providerName: "openai" as const,
      modelName: "gpt-4o-mini",
      model: provider("gpt-4o-mini"),
    };
  }

  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) {
    const provider = createLovableAiGatewayProvider(lovableKey);
    return {
      providerName: "lovable" as const,
      modelName: "google/gemini-2.0-flash",
      model: provider("google/gemini-2.0-flash"),
    };
  }

  return null;
}

export function getDefaultAIModel(modelOverride?: string) {
  const active = getActiveAIProvider();
  if (!active) {
    throw new Error(
      "AI API key not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your .env file to enable live AI responses."
    );
  }
  if (modelOverride) {
    if (active.providerName === "gemini") {
      const provider = createOpenAICompatible({
        name: "gemini",
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey:
          process.env["GEMINI_API_KEY"] ||
          process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
          process.env["GOOGLE_API_KEY"] ||
          "",
      });
      return provider(modelOverride);
    }
    if (active.providerName === "openai") {
      const provider = createOpenAICompatible({
        name: "openai",
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env["OPENAI_API_KEY"] || "",
      });
      return provider(modelOverride);
    }
    if (active.providerName === "lovable") {
      const provider = createLovableAiGatewayProvider(process.env["LOVABLE_API_KEY"] || "");
      return provider(modelOverride);
    }
  }
  return active.model;
}

