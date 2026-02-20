import Tts from 'react-native-tts';

class TTSService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await Tts.setDefaultRate(0.45);
      await Tts.setDefaultPitch(1.0);
      this.initialized = true;
    } catch (error) {
      console.warn('TTS initialization failed:', error);
    }
  }

  /**
   * Speak English text using en-US voice
   */
  async speakWord(text: string): Promise<void> {
    await this.initialize();
    try {
      await Tts.stop();
      await Tts.setDefaultLanguage('en-US');
      Tts.speak(text);
    } catch (error) {
      console.warn('TTS speakWord failed:', error);
    }
  }

  /**
   * Speak Chinese text using zh-CN voice
   */
  async speakChinese(text: string): Promise<void> {
    await this.initialize();
    try {
      await Tts.stop();
      await Tts.setDefaultLanguage('zh-CN');
      Tts.speak(text);
    } catch (error) {
      console.warn('TTS speakChinese failed:', error);
    }
  }

  /**
   * Stop any current TTS playback
   */
  async stop(): Promise<void> {
    try {
      await Tts.stop();
    } catch (error) {
      console.warn('TTS stop failed:', error);
    }
  }
}

export const ttsService = new TTSService();
