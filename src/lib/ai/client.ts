const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  id: string;
  content: Array<{ type: "text"; text: string }>;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

export async function generateCompletion(params: {
  system?: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const { system, messages, maxTokens = 1024, temperature = 0.7 } = params;

  const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${error}`);
  }

  const data: AnthropicResponse = await res.json();
  return data.content[0]?.text || "";
}
