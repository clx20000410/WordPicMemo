import { Injectable } from '@nestjs/common';
import { ITextGenerator } from './interfaces/text-generator.interface';
import { IImageGenerator } from './interfaces/image-generator.interface';
import { OpenAITextAdapter } from './adapters/openai-text.adapter';
import { OpenAIStreamTextAdapter } from './adapters/openai-stream-text.adapter';
import { OpenAIImageAdapter } from './adapters/openai-image.adapter';
import { ClaudeTextAdapter } from './adapters/claude-text.adapter';
import { ZhipuTextAdapter } from './adapters/zhipu-text.adapter';
import { GeminiTextAdapter } from './adapters/gemini-text.adapter';
import { CustomAdapter } from './adapters/custom.adapter';

export interface AdapterConfig {
  provider: string;
  responseFormat?: string;
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
}

@Injectable()
export class AIAdapterFactory {
  createTextGenerator(config: AdapterConfig): ITextGenerator {
    // Prefer responseFormat for adapter selection; fall back to provider
    const format = config.responseFormat || config.provider;

    switch (format) {
      case 'openai':
        return new OpenAITextAdapter(
          config.apiKey,
          config.apiEndpoint,
          config.modelName,
        );
      case 'openai-stream':
        return new OpenAIStreamTextAdapter(
          config.apiKey,
          config.apiEndpoint,
          config.modelName,
        );
      case 'claude':
        return new ClaudeTextAdapter(
          config.apiKey,
          config.apiEndpoint,
          config.modelName,
        );
      case 'gemini':
        return new GeminiTextAdapter(
          config.apiKey,
          config.apiEndpoint,
          config.modelName,
        );
      // Legacy provider-based fallback
      case 'zhipu':
        return new ZhipuTextAdapter(
          config.apiKey,
          config.apiEndpoint,
          config.modelName,
        );
      case 'doubao':
      case 'custom':
        return new CustomAdapter(
          config.apiKey,
          config.apiEndpoint,
          config.modelName,
        );
      default:
        throw new Error(
          `Unsupported text generation format: ${format}`,
        );
    }
  }

  createImageGenerator(config: AdapterConfig): IImageGenerator {
    // Prefer responseFormat for adapter selection; fall back to provider
    const format = config.responseFormat || config.provider;

    switch (format) {
      case 'dall-e':
      case 'openai':
        return new OpenAIImageAdapter(
          config.apiKey,
          config.apiEndpoint,
          config.modelName,
        );
      case 'custom':
        return new CustomAdapter(
          config.apiKey,
          config.apiEndpoint,
          config.modelName,
        );
      default:
        throw new Error(
          `Image generation not supported for format: ${format}`,
        );
    }
  }
}
