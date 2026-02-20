import OpenAI from 'openai';
import {
  ITextGenerator,
  WordExplanationRequest,
  WordExplanationResult,
} from '../interfaces/text-generator.interface';
import { buildExplanationPrompt } from '../prompts/explanation.prompt';
import { extractJson } from '../utils/json-extractor';

/**
 * Zhipu (GLM) Text Adapter.
 * Zhipu API is OpenAI-compatible, so we reuse the OpenAI SDK
 * with the Zhipu endpoint.
 */
export class ZhipuTextAdapter implements ITextGenerator {
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

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please generate a vocabulary memory aid for the word: "${request.word}"`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Zhipu API returned an empty response');
    }

    const result: WordExplanationResult = extractJson(content);
    return result;
  }

  async testConnection(): Promise<boolean> {
    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
    });
    return !!response.choices[0]?.message?.content;
  }
}
