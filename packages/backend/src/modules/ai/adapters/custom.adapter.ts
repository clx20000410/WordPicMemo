import OpenAI from 'openai';
import {
  ITextGenerator,
  WordExplanationRequest,
  WordExplanationResult,
} from '../interfaces/text-generator.interface';
import {
  IImageGenerator,
  ImageGenerationRequest,
  ImageGenerationResult,
} from '../interfaces/image-generator.interface';
import { buildExplanationPrompt } from '../prompts/explanation.prompt';
import { extractJson } from '../utils/json-extractor';

/**
 * Custom Adapter for OpenAI-compatible endpoints.
 * Implements both ITextGenerator and IImageGenerator interfaces,
 * making it suitable for providers like Doubao or any custom
 * OpenAI-compatible API.
 *
 * Features graceful fallback for response_format support:
 * first tries with json_object format, falls back to plain text
 * if the provider doesn't support it.
 */
export class CustomAdapter implements ITextGenerator, IImageGenerator {
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
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Please generate a vocabulary memory aid for the word: "${request.word}"`,
      },
    ];

    let content: string | null = null;

    // Try with response_format first, fall back if not supported
    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });
      content = response.choices[0]?.message?.content;
    } catch (error: any) {
      const errMsg = error?.message || '';
      const isFormatError =
        error?.status === 400 ||
        errMsg.includes('response_format') ||
        errMsg.includes('json_object') ||
        errMsg.includes('not support');

      if (isFormatError) {
        // Fallback: retry without response_format
        const response = await this.client.chat.completions.create({
          model: this.modelName,
          messages,
          temperature: 0.7,
        });
        content = response.choices[0]?.message?.content;
      } else {
        throw error;
      }
    }

    if (!content) {
      throw new Error('API returned an empty response');
    }

    // Extract JSON robustly (handles markdown fences, extra text, etc.)
    const result: WordExplanationResult = extractJson(content);
    return result;
  }

  async generateImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResult> {
    const size = (request.size || '1024x1024') as
      | '256x256'
      | '512x512'
      | '1024x1024'
      | '1792x1024'
      | '1024x1792';

    const response = await this.client.images.generate({
      model: this.modelName,
      prompt: request.prompt,
      n: 1,
      size,
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('API image generation returned no URL');
    }

    return { imageUrl };
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
