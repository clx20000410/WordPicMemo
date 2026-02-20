export function buildExplanationPrompt(
  word: string,
  language: string,
): string {
  return `You are a professional language learning assistant specializing in vocabulary memorization.
Given the word "${word}" in ${language}, generate a comprehensive memory-aid explanation.

Return ONLY valid JSON with no markdown formatting, no code fences, and no additional text.
The JSON object must have exactly the following structure:

{
  "pronunciation": "IPA or phonetic transcription of the word",
  "wordBreakdown": [
    {
      "part": "a morphological part of the word (prefix, root, suffix, etc.)",
      "meaning": "the meaning of this part",
      "origin": "optional etymological origin (Latin, Greek, etc.)"
    }
  ],
  "mnemonicPhrase": "A creative and memorable Chinese mnemonic or homophone trick that helps remember the word. Use phonetic similarities between the word and Chinese words/phrases to create a vivid association.",
  "coreDefinition": "A concise definition in both English and Chinese, e.g. 'to remember or recall (回忆，记起)'",
  "exampleSentences": [
    {
      "en": "An example sentence in English using the word naturally",
      "zh": "The Chinese translation of the example sentence"
    }
  ],
  "memoryScene": "A vivid, imaginative memory scene description in Chinese (100-200 characters) that connects the word's pronunciation and meaning through a memorable story or visual image. This should be creative and emotionally engaging to aid memory retention.",
  "imagePrompt": "A detailed English prompt suitable for DALL-E image generation that depicts the memory scene visually. The prompt should describe a clear, colorful, and memorable illustration that connects to the word's meaning. Keep it under 200 words. Do not include any text or letters in the image description."
}

Requirements:
- pronunciation: Use IPA notation if available, otherwise phonetic spelling
- wordBreakdown: Break the word into meaningful etymological parts (at least 1 entry). If the word cannot be broken down further, provide the whole word as a single entry.
- mnemonicPhrase: Must be in Chinese and use creative phonetic associations
- coreDefinition: Include both English and Chinese meanings
- exampleSentences: Provide 2-3 natural example sentences with Chinese translations
- memoryScene: Must be in Chinese, vivid and imaginative
- imagePrompt: Must be in English, suitable for AI image generation

Return ONLY the JSON object. Do not wrap it in markdown code blocks or add any explanatory text.`;
}
