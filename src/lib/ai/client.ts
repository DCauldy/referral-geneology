const OPENAI_API_BASE = "https://api.openai.com/v1";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: Array<{ message: { role: string; content: string } }>;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function generateCompletion(params: {
  system?: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const { system, messages, maxTokens = 1024, temperature = 0.7 } = params;

  const openAIMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (system) {
    openAIMessages.push({ role: "system", content: system });
  }
  openAIMessages.push(...messages);

  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_completion_tokens: maxTokens,
      temperature,
      messages: openAIMessages,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${error}`);
  }

  const data: OpenAIResponse = await res.json();
  return data.choices[0]?.message?.content || "";
}
