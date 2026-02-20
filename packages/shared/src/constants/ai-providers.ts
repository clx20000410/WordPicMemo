import { AIProvider, AIPurpose, ResponseFormat } from '../types/ai-config';

// ==========================================
// AI Provider Definitions
// ==========================================

export interface AIProviderInfo {
  provider: AIProvider;
  name: string;
  supportedPurposes: AIPurpose[];
  defaultEndpoint: string;
  defaultModels: Record<AIPurpose, string>;
  description: string;
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderInfo> = {
  openai: {
    provider: 'openai',
    name: 'OpenAI',
    supportedPurposes: ['text', 'image'],
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModels: {
      text: 'gpt-4o-mini',
      image: 'dall-e-3',
    },
    description: 'OpenAI GPT models for text, DALL-E for images',
  },
  claude: {
    provider: 'claude',
    name: 'Anthropic Claude',
    supportedPurposes: ['text'],
    defaultEndpoint: 'https://api.anthropic.com',
    defaultModels: {
      text: 'claude-sonnet-4-20250514',
      image: '',
    },
    description: 'Anthropic Claude models for text generation',
  },
  zhipu: {
    provider: 'zhipu',
    name: '智谱AI (Zhipu)',
    supportedPurposes: ['text', 'image'],
    defaultEndpoint: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModels: {
      text: 'glm-4-flash',
      image: 'cogview-3-plus',
    },
    description: '智谱AI GLM models for text, CogView for images',
  },
  doubao: {
    provider: 'doubao',
    name: '豆包 (Doubao)',
    supportedPurposes: ['text'],
    defaultEndpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModels: {
      text: 'doubao-pro-32k',
      image: '',
    },
    description: '字节跳动豆包大模型',
  },
  custom: {
    provider: 'custom',
    name: 'Custom (OpenAI Compatible)',
    supportedPurposes: ['text', 'image'],
    defaultEndpoint: '',
    defaultModels: {
      text: '',
      image: '',
    },
    description: 'Any OpenAI-compatible API endpoint',
  },
};

export const AI_PROVIDER_LIST = Object.values(AI_PROVIDERS);

// ==========================================
// Response Format Definitions
// ==========================================

export interface ResponseFormatInfo {
  value: ResponseFormat;
  label: string;
  description: string;
}

export const TEXT_RESPONSE_FORMATS: ResponseFormatInfo[] = [
  { value: 'openai', label: 'OpenAI', description: 'choices[0].message.content' },
  { value: 'openai-stream', label: 'OpenAI Stream', description: 'choices[0].delta.content' },
  { value: 'claude', label: 'Claude', description: 'content[0].text' },
  { value: 'gemini', label: 'Gemini', description: 'candidates[0].content.parts[0].text' },
];

export const IMAGE_RESPONSE_FORMATS: ResponseFormatInfo[] = [
  { value: 'dall-e', label: 'DALL-E', description: 'OpenAI Image API' },
];
