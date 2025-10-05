const DEFAULT_MODEL = 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function stripDataUrl(dataUrl) {
  if (!dataUrl) return '';
  const [, base64] = dataUrl.split(',');
  return base64 ?? dataUrl;
}

function isGeminiApiKey(input) {
  const trimmed = input?.trim() || '';
  return trimmed.startsWith('AIzaSy') && trimmed.length === 39;
}

export class GeminiClient {
  constructor({ apiKey = '', logger }) {
    this.apiKey = apiKey;
    this.logger = logger;
    this.model = DEFAULT_MODEL;
    this.authType = null; // 'api_key' or 'keyword'
  }

  setApiKey(key) {
    this.apiKey = key || '';

    // Auto-detect auth type
    if (isGeminiApiKey(this.apiKey)) {
      this.authType = 'api_key';
    } else {
      this.authType = 'keyword';
    }
  }

  getAuthType() {
    return this.authType;
  }

  getApiKey() {
    return this.apiKey;
  }

  hasApiKey() {
    return Boolean(this.apiKey);
  }

  setModel(model) {
    this.model = model;
  }

  async analyzeFrame({ base64Image, prompt, abortSignal }) {
    if (!this.apiKey) {
      throw new Error('Missing API key or access keyword');
    }

    // Route based on auth type
    if (this.authType === 'keyword') {
      this.logger?.log('Sending frame to backend proxy');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session auth
        body: JSON.stringify({
          image_data: stripDataUrl(base64Image),
          perspective_prompt: prompt,
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        this.logger?.log('Backend proxy error', 'error', errorBody);
        const message = errorBody.message ?? response.statusText;
        throw new Error(`Proxy error: ${message}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Analysis failed');
      }

      return {
        text: data.description || '',
        raw: data,
      };
    }

    // Direct API call for own API key
    const url = `${BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: stripDataUrl(base64Image),
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
      },
    };

    this.logger?.log('Sending frame to Gemini API (direct)');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      this.logger?.log('Gemini API responded with error', 'error', errorBody);
      const message = errorBody.error?.message ?? response.statusText;
      throw new Error(`Gemini API error: ${message}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('\n') ?? '';

    return {
      text,
      raw: data,
    };
  }

  async generateText({ prompt, abortSignal, temperature = 0.4 }) {
    if (!this.apiKey) {
      throw new Error('Missing Gemini API key');
    }

    // Route based on auth type
    if (this.authType === 'keyword') {
      // Use backend proxy for keyword auth
      this.logger?.log('Generating summary via backend proxy');

      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session auth
        body: JSON.stringify({ prompt }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        this.logger?.log('Backend proxy error', 'error', errorBody);
        const message = errorBody.message ?? response.statusText;
        throw new Error(`Proxy error: ${message}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Summary generation failed');
      }

      return {
        text: data.text || '',
        raw: data,
      };
    }

    // Direct API call for own API key
    const url = `${BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
      },
    };

    this.logger?.log('Generating summary via direct API');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      this.logger?.log('Gemini summary error', 'error', errorBody);
      const message = errorBody.error?.message ?? response.statusText;
      throw new Error(`Gemini API error: ${message}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('\n') ?? '';

    return {
      text,
      raw: data,
    };
  }
}
