declare module 'react-native-tts' {
  interface TtsOptions {
    iosVoiceId?: string;
    rate?: number;
    androidParams?: {
      KEY_PARAM_PAN?: number;
      KEY_PARAM_VOLUME?: number;
      KEY_PARAM_STREAM?: string;
    };
  }

  const Tts: {
    speak(utterance: string, options?: TtsOptions): Promise<string>;
    stop(onWordBoundary?: boolean): Promise<boolean>;
    setDefaultLanguage(language: string): Promise<string>;
    setDefaultRate(rate: number, skipTransform?: boolean): Promise<string>;
    setDefaultPitch(pitch: number): Promise<string>;
    setDefaultVoice(voiceId: string): Promise<string>;
    voices(): Promise<Array<{ id: string; name: string; language: string }>>;
    addEventListener(event: string, handler: (...args: any[]) => void): void;
    removeEventListener(event: string, handler: (...args: any[]) => void): void;
  };

  export default Tts;
}

declare module '@react-native-community/datetimepicker' {
  import { Component } from 'react';

  interface DateTimePickerProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime';
    display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'compact' | 'inline';
    onChange?: (event: any, date?: Date) => void;
    maximumDate?: Date;
    minimumDate?: Date;
    timeZoneName?: string;
    timeZoneOffsetInMinutes?: number;
    locale?: string;
    is24Hour?: boolean;
    minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
    style?: any;
    disabled?: boolean;
    themeVariant?: 'light' | 'dark';
    testID?: string;
  }

  export default class DateTimePicker extends Component<DateTimePickerProps> {}
}
