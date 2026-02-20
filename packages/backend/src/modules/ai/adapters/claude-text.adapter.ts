import Anthropic from '@anthropic-ai/sdk';
import {
  ITextGenerator,
  WordExplanationRequest,
  WordExplanationResult,
} from '../interfaces/text-generator.interface';
import { buildExplanationPrompt } from '../prompts/explanation.prompt';
import { extractJson } from '../utils/json-extractor';

export class ClaudeTextAdapter implements ITextGenerator {
  private readonly client: Anthropic;

  constructor(
    private readonly apiKey: string,
    private readonly endpoint: string,
    private readonly modelName: string,
  ) {
    const options: { apiKey: string; baseURL?: string } = {
      apiKey: this.apiKey,
    };
    if (this.endpoint) {
      options.baseURL = this.endpoint;
    }
    this.client = new Anthropic(options);
  }

  async generateExplanation(
    request: WordExplanationRequest,
  ): Promise<WordExplanationResult> {
    const systemPrompt = buildExplanationPrompt(request.word, request.language);

    const response = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Please generate a vocabulary memory aid for the word: "${request.word}"`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude returned no text content');
    }

    const content = textBlock.text;

    // Extract JSON robustly (handles markdown fences, extra text, etc.)
    const result: WordExplanationResult = extractJson(content);
    return result;
  }

  async testConnection(): Promise<boolean> {
    const response = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return response.content.length > 0;
  }
}
