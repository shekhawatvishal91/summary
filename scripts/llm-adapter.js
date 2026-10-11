/**
 * scripts/llm-adapter.js
 * Pluggable, provider-agnostic LLM interface for AI Knowledge Brain OS
 *
 * Supported providers:
 * - Gemini (via process.env.GEMINI_API_KEY)
 * - OpenAI (via process.env.OPENAI_API_KEY)
 * - Anthropic (via process.env.ANTHROPIC_API_KEY)
 * - MockLLMProvider (deterministic mock for automated testing)
 */

const https = require('https');

class BaseLLMProvider {
  constructor(name) {
    this.name = name;
  }
  isConfigured() {
    return false;
  }
  async generateCompletion(prompt, options = {}) {
    throw new Error(`Provider ${this.name} does not implement generateCompletion`);
  }
}

/**
 * Gemini Provider via official REST endpoint
 */
class GeminiProvider extends BaseLLMProvider {
  constructor() {
    super('Gemini');
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateCompletion(prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }

    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature || 0.2,
        maxOutputTokens: options.maxTokens || 4096
      }
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const responseText = await postRequest(url, payload, { 'Content-Type': 'application/json' });
    const json = JSON.parse(responseText);

    if (json.error) {
      throw new Error(`Gemini API Error: ${json.error.message || JSON.stringify(json.error)}`);
    }

    return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

/**
 * OpenAI Provider via standard Chat Completions REST
 */
class OpenAIProvider extends BaseLLMProvider {
  constructor() {
    super('OpenAI');
    this.apiKey = process.env.OPENAI_API_KEY || null;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateCompletion(prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('OPENAI_API_KEY is not configured in environment.');
    }

    const payload = JSON.stringify({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.2
    });

    const url = 'https://api.openai.com/v1/chat/completions';
    const responseText = await postRequest(url, payload, {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    });
    const json = JSON.parse(responseText);

    if (json.error) {
      throw new Error(`OpenAI API Error: ${json.error.message}`);
    }

    return json.choices?.[0]?.message?.content || '';
  }
}

/**
 * Anthropic Provider via Messages REST API
 */
class AnthropicProvider extends BaseLLMProvider {
  constructor() {
    super('Anthropic');
    this.apiKey = process.env.ANTHROPIC_API_KEY || null;
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateCompletion(prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('ANTHROPIC_API_KEY is not configured in environment.');
    }

    const payload = JSON.stringify({
      model: this.model,
      max_tokens: options.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const url = 'https://api.anthropic.com/v1/messages';
    const responseText = await postRequest(url, payload, {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    });
    const json = JSON.parse(responseText);

    if (json.error) {
      throw new Error(`Anthropic API Error: ${json.error.message}`);
    }

    return json.content?.[0]?.text || '';
  }
}

/**
 * Deterministic Mock Provider for offline testing & gold-standard verification
 */
class MockLLMProvider extends BaseLLMProvider {
  constructor(customHandler = null) {
    super('MockLLMProvider');
    this.customHandler = customHandler;
  }

  isConfigured() {
    return true;
  }

  async generateCompletion(prompt, options = {}) {
    if (this.customHandler) {
      return this.customHandler(prompt, options);
    }

    // Default valid structured decoding JSON response
    return JSON.stringify({
      decoding_status: 'MOCK_AI_DECODED',
      model_identifier: 'mock-llm-engine-v1',
      prompt_version: '2026-10-v1',
      dimensions: {
        dim_1_core_thesis: {
          premise: 'Human cognitive control is physiologically bottlenecked by finite prefrontal working memory capacity.',
          paradigm_shift: 'Demolishes the legacy continuous-effort dogma; proves capacity is strictly quantized to discrete representation chunks.'
        },
        dim_2_causal_model: {
          mechanism: 'Dorsolateral prefrontal synaptic signal-to-noise ratio is governed by dopaminergic tuning; sustained control accumulates extracellular adenosine.',
          ratios_in_prose: 'Unchunked items degrade catastrophically beyond 4 plus or minus 1 items.'
        },
        dim_3_master_analogy: {
          analogy: 'The acoustic resonator versus broadband transmitter: prefrontal buffers can maintain high fidelity on 4 discrete frequencies before destructive interference collapses the signal.'
        },
        dim_4_diagnostics: {
          classifications: [
            { state: 'Attentional Hyper-Focus', symptom: 'Inability to switch tasks', etiology: 'Excess striatal dopamine' },
            { state: 'Cognitive Fragmentation', symptom: 'High latency churn', etiology: 'Low prefrontal signal-to-noise' },
            { state: 'Executive Paralysis', symptom: 'Procrastination', etiology: 'High conflict signal, low reward expectation' }
          ],
          failure_modes: ['Attempting multi-objective execution under sleep deprivation induces rapid working memory collapse.']
        },
        dim_5_field_protocols: {
          algorithm: [
            '1. Externalize active working memory state within 90 seconds.',
            '2. Restrict concurrent active goals to a single token.',
            '3. Enforce 4-minute sensory reset when conflict threshold is reached.'
          ],
          verbatim_scripts: ['"My executive bandwidth is currently at capacity; I can commit to task X only upon externalizing task Y."']
        },
        dim_6_skeptic_box: {
          pop_culture_distortion: 'Ego depletion is a mystical willpower muscle that runs out of glucose.',
          clinical_empirical_reality: 'Executive fatigue is mediated by local prefrontal adenosine accumulation and neuromodulatory signal decay, not systemic glucose deficit.'
        }
      },
      extracted_claims: [
        {
          statement: 'Unchunked working memory capacity is strictly bounded to 4 plus or minus 1 discrete mental representations under active cognitive load.',
          epistemic_class: 'SOURCE_STATEMENT',
          claim_type: 'empirical_finding',
          locator: 'sec: The Prefrontal Capacity Ceiling # para-2',
          verbatim_quote: 'unchunked active memory representations degrade catastrophically beyond 4 plus or minus 1 discrete semantic units.'
        },
        {
          statement: 'The subjective sensation of executive fatigue is mediated by prefrontal adenosine accumulation rather than systemic glucose exhaustion.',
          epistemic_class: 'SOURCE_STATEMENT',
          claim_type: 'empirical_finding',
          locator: 'sec: Neurochemical Modulation & Ego Depletion # para-1',
          verbatim_quote: null
        },
        {
          statement: 'Externalizing working memory tokens onto physical substrates within 90 seconds preserves executive bandwidth.',
          epistemic_class: 'SOURCE_INFERENCE',
          claim_type: 'protocol',
          locator: 'sec: Behavioral De-escalation Protocol # para-1',
          verbatim_quote: null
        }
      ],
      proposed_concepts: [
        {
          name: 'Working Memory Capacity Ceiling',
          aliases: ['Central Executive Bottleneck', 'Discrete Chunk Limit'],
          domain: 'Cognitive Neuroscience',
          definition: 'The physiological constraint limiting active unchunked representation buffers to 4 ± 1 items.'
        }
      ],
      proposed_relationships: [
        {
          source_concept: 'Working Memory Capacity Ceiling',
          target_concept: 'Ego Depletion',
          relation_type: 'extends',
          description: 'Physiological mechanism underpinning subjective cognitive exertion limits.'
        }
      ],
      coverage_warnings: []
    });
  }
}

/**
 * Standard HTTPS POST request helper with timeout
 */
function postRequest(urlStr, data, headers = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: timeoutMs
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else if (res.statusCode === 429) {
          reject(new Error(`HTTP 429: Rate limit exceeded from ${url.hostname}`));
        } else {
          reject(new Error(`HTTP ${res.statusCode} from ${url.hostname}: ${body}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms to ${url.hostname}`));
    });

    req.on('error', err => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Resolves active LLM provider
 */
function getActiveProvider(options = {}) {
  if (options.forceMock) {
    return new MockLLMProvider(options.customMockHandler);
  }

  const gemini = new GeminiProvider();
  if (gemini.isConfigured()) return gemini;

  const openai = new OpenAIProvider();
  if (openai.isConfigured()) return openai;

  const anthropic = new AnthropicProvider();
  if (anthropic.isConfigured()) return anthropic;

  return {
    name: 'None',
    isConfigured: () => false,
    generateCompletion: async () => {
      throw new Error(
        'No authorized LLM provider configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.'
      );
    }
  };
}

module.exports = {
  BaseLLMProvider,
  GeminiProvider,
  OpenAIProvider,
  AnthropicProvider,
  MockLLMProvider,
  getActiveProvider
};
