export interface ImageGenerationRequest {
  prompt: string;
  size?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
}

export interface IImageGenerator {
  generateImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResult>;
  testConnection(): Promise<boolean>;
}
