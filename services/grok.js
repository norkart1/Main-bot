const OpenAI = require('openai');

let _client = null;
function getClient() {
  if (!_client) {
    _client = new OpenAI({ baseURL: 'https://api.x.ai/v1', apiKey: process.env.XAI_API_KEY });
  }
  return _client;
}

async function askGrok(question, { systemPrompt = null, history = [], maxTokens = 1024 } = {}) {
  const client = getClient();
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  for (const h of history) messages.push(h);
  messages.push({ role: 'user', content: question });

  const res = await client.chat.completions.create({
    model: 'grok-2-1212',
    messages,
    max_tokens: maxTokens,
  });
  return res.choices[0].message.content.trim();
}

async function generateImage(prompt) {
  const client = getClient();
  const res = await client.images.generate({
    model: 'grok-2-image-1212',
    prompt,
    n: 1,
  });
  return res.data[0].url || res.data[0].b64_json || null;
}

async function moderateMessage(text) {
  const client = getClient();
  const res = await client.chat.completions.create({
    model: 'grok-2-1212',
    messages: [
      {
        role: 'system',
        content: `You are a Discord moderation AI. Analyze the following message and respond ONLY with a JSON object in this exact format:
{"violation": true/false, "reason": "short reason or null", "action": "delete" | "warn" | "timeout" | "none"}

Categories to flag (violation=true):
- Hate speech, slurs, racism, sexism
- Explicit sexual content (NSFW)
- Spam (repeated chars, all caps, excessive emojis)
- Phishing / scam / malware links
- Discord server invite spam
- Severe profanity / harassment / threats
- Self-harm promotion

If clean, respond: {"violation": false, "reason": null, "action": "none"}
Be strict but fair. Short messages with mild language are fine.`,
      },
      { role: 'user', content: `Message: ${text}` },
    ],
    max_tokens: 120,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return { violation: false, reason: null, action: 'none' };
  }
}

module.exports = { askGrok, generateImage, moderateMessage };
