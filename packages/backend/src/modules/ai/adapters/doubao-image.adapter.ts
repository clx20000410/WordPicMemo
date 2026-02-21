import {
  IImageGenerator,
  ImageGenerationRequest,
  ImageGenerationResult,
} from '../interfaces/image-generator.interface';

/**
 * Doubao (Volcengine Ark) Seedream Image Adapter.
 * Uses direct HTTP requests to support Doubao-specific parameters
 * like sequential_image_generation, watermark, and non-standard size values.
 */
export class DoubaoImageAdapter implements IImageGenerator {
  constructor(
    private readonly apiKey: string,
    private readonly endpoint: string,
    private readonly modelName: string,
  ) {}

  async generateImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResult> {
    const url = `${this.endpoint.replace(/\/+$/, '')}/images/generations`;
    const size = request.size || '1024x1024';

    const body = {
      model: this.modelName,
      prompt: request.prompt,
      response_format: 'url',
      size,
      sequential_image_generation: 'disabled',
      stream: false,
      watermark: false,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Doubao image API error [HTTP ${response.status}]: ${errorText}`,
      );
    }

    const data = await response.json();
    const imageUrl = data?.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('Doubao image generation returned no URL');
    }

    return { imageUrl };
  }

  async testConnection(): Promise<boolean> {
    const url = `${this.endpoint.replace(/\/+$/, '')}/models`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    return response.ok;
  }
}
