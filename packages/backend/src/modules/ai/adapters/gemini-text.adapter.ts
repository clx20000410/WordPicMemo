import {
  ITextGenerator,
  WordExplanationRequest,
  WordExplanationResult,
} from '../interfaces/text-generator.interface';
import { buildExplanationPrompt } from '../prompts/explanation.prompt';
import { extractJson } from '../utils/json-extractor';

/**
 * Gemini Text Adapter using native fetch for Google Gemini REST API.
 *
 * Request format: POST {endpoint}/models/{model}:generateContent
 * Auth: x-goog-api-key header
 * Response: candidates[0].content.parts[0].text
 */
export class GeminiTextAdapter implements ITextGenerator {
  constructor(
    private readonly apiKey: string,
    private readonly endpoint: string,
    private readonly modelName: string,
  ) {}

  async generateExplanation(
    request: WordExplanationRequest,
  ): Promise<WordExplanationResult> {
    const systemPrompt = buildExplanationPrompt(request.word, request.language);

    const url = `${this.endpoint}/models/${this.modelName}:generateContent`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nPlease generate a vocabulary memory aid for the word: "${request.word}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Gemini returned an empty response');
    }

    const result: WordExplanationResult = extractJson(content);
    return result;
  }

  async testConnection(): Promise<boolean> {
    const url = `${this.endpoint}/models/${this.modelName}:generateContent`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'ping' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 5,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();
    return !!data?.candidates?.[0]?.content?.parts?.[0]?.text;
  }
}
