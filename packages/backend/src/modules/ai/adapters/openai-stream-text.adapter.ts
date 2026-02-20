import OpenAI from 'openai';
import {
  ITextGenerator,
  WordExplanationRequest,
  WordExplanationResult,
} from '../interfaces/text-generator.interface';
import { buildExplanationPrompt } from '../prompts/explanation.prompt';
import { extractJson } from '../utils/json-extractor';

/**
 * OpenAI Stream Text Adapter using OpenAI SDK with stream: true.
 *
 * Collects all choices[0].delta.content chunks and concatenates them.
 * Final result is parsed via extractJson().
 */
export class OpenAIStreamTextAdapter implements ITextGenerator {
  private readonly client: OpenAI;

  constructor(
    private readonly apiKey: string,
    private readonly endpoint: string,
    private readonly modelName: string,
  ) {
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.endpoint,
    });
  }

  async generateExplanation(
    request: WordExplanationRequest,
  ): Promise<WordExplanationResult> {
    const systemPrompt = buildExplanationPrompt(request.word, request.language);

    const stream = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please generate a vocabulary memory aid for the word: "${request.word}"`,
        },
      ],
      stream: true,
      temperature: 0.7,
    });

    // Collect all streamed chunks
    let content = '';
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        content += delta;
      }
    }

    if (!content) {
      throw new Error('OpenAI stream returned an empty response');
    }

    const result: WordExplanationResult = extractJson(content);
    return result;
  }

  async testConnection(): Promise<boolean> {
    const stream = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
      stream: true,
    });

    let content = '';
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        content += delta;
      }
    }

    return !!content;
  }
}
