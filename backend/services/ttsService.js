// Turns a listening script into one WAV file with Gemini text-to-speech (one voice for a talk, two for a conversation).
const cfg = require('../config/tts');

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- splitting the script into requests ----------
const splitLong = (text, max) => {
  const sentences = String(text).match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [String(text)];
  const pieces = [];
  let current = '';
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (`${current} ${s}`.trim().length <= max) current = `${current} ${s}`.trim();
    else {
      if (current) pieces.push(current);
      current = s.length > max ? s.slice(0, max) : s;
    }
  }
  if (current) pieces.push(current);
  return pieces;
};

// Groups consecutive turns so each request stays short. A turn that is too long is cut at sentence ends.
const groupTurns = (turns, maxChars) => {
  const parts = [];
  for (const t of turns) {
    const text = String(t.text || '').trim();
    if (!text) continue;
    const speaker = t.speaker === 'B' ? 'B' : 'A';
    if (text.length <= maxChars) parts.push({ speaker, text });
    else splitLong(text, maxChars).forEach((piece) => parts.push({ speaker, text: piece }));
  }
  const groups = [];
  let current = [];
  let size = 0;
  for (const p of parts) {
    if (current.length && size + p.text.length > maxChars) {
      groups.push(current);
      current = [];
      size = 0;
    }
    current.push(p);
    size += p.text.length;
  }
  if (current.length) groups.push(current);
  return groups;
};

// ---------- request / response ----------
const buildRequest = (group, multi) => {
  const rate = cfg.sampleRate();
  const style = cfg.style;
  const parts = multi
    ? group.map((p) => ({ text: p.text, speech_metadata: { speaker: p.speaker, style } }))
    : [{ text: group.map((p) => p.text).join('\n\n'), speech_metadata: { style } }]; // one part for a single speaker

  return {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      responseFormat: { audio: { mimeType: 'AUDIO_L16', sampleRate: rate } },
      speechConfig: multi
        ? {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                { speaker: 'A', voiceConfig: { prebuiltVoiceConfig: { voiceName: cfg.voiceA() } } },
                { speaker: 'B', voiceConfig: { prebuiltVoiceConfig: { voiceName: cfg.voiceB() } } },
              ],
            },
          }
        : { voiceConfig: { voice: cfg.voiceA() } },
    },
  };
};

// Reads the raw 16-bit audio out of whatever came back: a WAV file, or headerless PCM.
const decodeAudio = (buffer, mimeType, requestedRate) => {
  if (buffer.length > 44 && buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WAVE') {
    let rate = buffer.readUInt32LE(24);
    let offset = 12;
    while (offset + 8 <= buffer.length) {
      const id = buffer.slice(offset, offset + 4).toString();
      const size = buffer.readUInt32LE(offset + 4);
      if (id === 'fmt ') rate = buffer.readUInt32LE(offset + 12);
      if (id === 'data') return { pcm: buffer.slice(offset + 8, Math.min(offset + 8 + size, buffer.length)), rate };
      offset += 8 + size + (size % 2);
    }
    return { pcm: buffer.slice(44), rate };
  }
  const match = /rate=(\d+)/i.exec(mimeType || '');
  return { pcm: buffer, rate: match ? Number(match[1]) : requestedRate };
};

const wrapWav = (pcm, rate) => {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28); // bytes per second
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

const requestAudio = async (body, attempt = 1) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.requestTimeoutMs);
  try {
    const res = await fetch(`${ENDPOINT}/${cfg.model()}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const error = new Error(`TTS request failed (${res.status}): ${detail.slice(0, 200)}`);
      error.retryable = res.status === 429 || res.status >= 500;
      throw error;
    }
    const json = await res.json();
    const part = (json?.candidates?.[0]?.content?.parts || []).find((p) => p?.inlineData?.data);
    if (!part) throw new Error('TTS returned no audio');
    return decodeAudio(Buffer.from(part.inlineData.data, 'base64'), part.inlineData.mimeType, cfg.sampleRate());
  } catch (err) {
    if (err.name === 'AbortError') err.message = 'TTS request timed out';
    if (attempt < 2 && (err.retryable || err.name === 'AbortError')) {
      await sleep(3000);
      return requestAudio(body, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// Main entry: returns { wav: Buffer, seconds: number }
exports.synthesizeScript = async ({ turns }) => {
  const multi = new Set((turns || []).map((t) => (t.speaker === 'B' ? 'B' : 'A'))).size > 1;
  const groups = groupTurns(turns || [], cfg.maxCharsPerRequest);
  if (!groups.length) throw new Error('The script is empty');

  const clips = [];
  for (const group of groups) clips.push(await requestAudio(buildRequest(group, multi))); // in order, one at a time

  const rate = clips[0].rate;
  if (clips.some((c) => c.rate !== rate)) throw new Error('TTS returned clips with different sample rates');

  const silence = (seconds) => Buffer.alloc(Math.round(rate * seconds) * 2);
  const pieces = [silence(0.4)];
  clips.forEach((clip, i) => {
    pieces.push(clip.pcm);
    pieces.push(silence(i === clips.length - 1 ? 0.8 : 0.35));
  });
  const pcm = Buffer.concat(pieces);
  return { wav: wrapWav(pcm, rate), seconds: Math.round(pcm.length / (rate * 2)) };
};

exports._groupTurns = groupTurns;
exports._buildRequest = buildRequest;
exports._decodeAudio = decodeAudio;
exports._wrapWav = wrapWav;
