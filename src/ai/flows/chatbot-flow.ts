'use server';

/**
 * @fileOverview A chatbot flow that can answer questions about the EnviroWatch dashboard.
 *
 * - chat - A function that handles the chatbot conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { compile } from 'handlebars';

const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The conversation history.'),
  message: z.string().describe('The latest user message.'),
  deviceData: z.array(z.object({
    id: z.string(),
    name: z.string(),
    location: z.string(),
    status: z.string(),
    coLevel: z.number(),
  })).optional().describe('Current data for all devices.'),
  alertData: z.array(z.object({
    id: z.string(),
    deviceName: z.string(),
    message: z.string(),
    severity: z.string(),
    timestamp: z.string(),
  })).optional().describe('Current alert data.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s response.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const systemPromptTemplate = `You are a helpful AI assistant for the EnviroWatch application, a dashboard that monitors Carbon Monoxide (CO) levels from various sensors.

Your role is to answer user questions based on the real-time data provided. Be concise and helpful.

Here is the current data:
{{#if deviceData}}
Devices:
{{#each deviceData}}
- Name: {{this.name}}, Location: {{this.location}}, Status: {{this.status}}, CO Level: {{this.coLevel}} ppm
{{/each}}
{{/if}}

{{#if alertData}}
Alerts:
{{#each alertData}}
- Device: {{this.deviceName}}, Severity: {{this.severity}}, Message: "{{this.message}}", Time: {{this.timestamp}}
{{/each}}
{{/if}}

If you don't have enough information to answer, say so. Do not make up information.
`;

const chatFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { history, message, deviceData, alertData } = input;

    // Compile the system prompt with the dynamic data
    const template = compile(systemPromptTemplate);
    const systemPrompt = template({ deviceData, alertData });
    
    // Exclude the latest user message from the history to avoid duplication.
    const conversationHistory = history.slice(0, -1);

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      prompt: message,
      history: conversationHistory.map(h => ({ role: h.role, content: [{ text: h.content }] })),
    });

    if (!output) {
        return { response: "Sorry, I couldn't generate a response. The request may have been blocked." };
    }

    return { response: output.text };
  }
);
