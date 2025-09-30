'use server';

/**
 * @fileOverview Detects unusual concentrations of Carbon Monoxide using AI-powered anomaly detection.
 *
 * - detectCoAnomaly - A function that handles the CO anomaly detection process.
 * - DetectCoAnomalyInput - The input type for the detectCoAnomaly function.
 * - DetectCoAnomalyOutput - The return type for the detectCoAnomaly function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectCoAnomalyInputSchema = z.object({
  deviceId: z.string().describe('The ID of the sensor device.'),
  coLevel: z.number().describe('The current level of Carbon Monoxide detected by the sensor (in ppm).'),
  timestamp: z.string().describe('The timestamp of the CO level reading (ISO format).'),
  historicalData: z.array(z.object({
    coLevel: z.number(),
    timestamp: z.string(),
  })).describe('Historical CO level data for the device.'),
});
export type DetectCoAnomalyInput = z.infer<typeof DetectCoAnomalyInputSchema>;

const DetectCoAnomalyOutputSchema = z.object({
  isAnomaly: z.boolean().describe('Whether the current CO level is anomalous.'),
  explanation: z.string().describe('Explanation of why the CO level is considered an anomaly or not.'),
});
export type DetectCoAnomalyOutput = z.infer<typeof DetectCoAnomalyOutputSchema>;

export async function detectCoAnomaly(input: DetectCoAnomalyInput): Promise<DetectCoAnomalyOutput> {
  return detectCoAnomalyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectCoAnomalyPrompt',
  input: {schema: DetectCoAnomalyInputSchema},
  output: {schema: DetectCoAnomalyOutputSchema},
  prompt: `You are an expert environmental safety analyst specializing in detecting Carbon Monoxide (CO) anomalies.

You are provided with a real-time CO reading from a sensor and its historical data.

Based on the provided information, determine if the current CO level is anomalous. Consider factors such as:

- Sudden spikes or drops compared to the immediate history.
- The overall trend (is it steadily climbing?).
- The absolute value of the reading.

Return whether the current CO level is anomalous (isAnomaly: true/false) and provide a brief, clear explanation for your decision.

Here is the sensor data:

Device ID: {{{deviceId}}}
Current CO Level: {{{coLevel}}} ppm
Timestamp: {{{timestamp}}}

Recent Historical Data (oldest to newest):
{{#each historicalData}}
- CO Level: {{{this.coLevel}}} ppm, Timestamp: {{{this.timestamp}}}
{{/each}}
`,
});

const detectCoAnomalyFlow = ai.defineFlow(
  {
    name: 'detectCoAnomalyFlow',
    inputSchema: DetectCoAnomalyInputSchema,
    outputSchema: DetectCoAnomalyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // If the model returns no response, assume it's not an anomaly
      // to avoid false positives. You could also handle this differently.
      return {
        isAnomaly: false,
        explanation: 'Could not determine anomaly status from the model response.',
      };
    }
    return output;
  }
);
