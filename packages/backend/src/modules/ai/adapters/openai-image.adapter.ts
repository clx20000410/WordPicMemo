import OpenAI from 'openai';
import {
  IImageGenerator,
  ImageGenerationRequest,
  ImageGenerationResult,
} from '../interfaces/image-generator.interface';

export class OpenAIImageAdapter implements IImageGenerator {
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
      throw new Error('OpenAI image generation returned no URL');
    }

    return { imageUrl };
  }

  async testConnection(): Promise<boolean> {
    await this.client.models.list();
    return true;
  }
}
