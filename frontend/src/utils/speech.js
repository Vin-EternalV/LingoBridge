// Text-to-speech for pronunciation. Uses the phone's built-in voices (and the browser's on web),
// so it needs no account, key or internet-based service.
import * as Speech from 'expo-speech';

export const NORMAL_RATE = 0.95;
export const SLOW_RATE = 0.55;
const MAX_CHUNK = 220; // long text is read in pieces; some browsers cut off a long single utterance

// Makes chat/exercise text pleasant to hear: "___" becomes "blank", markdown marks and emoji are dropped.
export const cleanForSpeech = (text) =>
  String(text || '')
    .replace(/_{2,}/g, ' blank ')
    .replace(/[`*_#>~]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const splitLong = (sentence) => {
  const parts = [];
  let rest = sentence;
  while (rest.length > MAX_CHUNK * 2) {
    let cut = rest.lastIndexOf(' ', MAX_CHUNK * 2);
    if (cut < MAX_CHUNK) cut = MAX_CHUNK * 2;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
};

// Groups whole sentences into pieces of roughly MAX_CHUNK characters.
export const chunkText = (text) => {
  const sentences = text.match(/[^.!?\n]+[.!?]*\s*/g) || [text];
  const chunks = [];
  let current = '';
  sentences.forEach((sentence) => {
    if (current && (current + sentence).length > MAX_CHUNK) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  });
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap((chunk) => (chunk.length > MAX_CHUNK * 2 ? splitLong(chunk) : [chunk]));
};

// Only the newest request counts: callbacks from an interrupted one are ignored.
let session = 0;
let activeEnd = null;

const finish = (id) => {
  if (id !== session) return;
  const callback = activeEnd;
  activeEnd = null;
  if (callback) callback();
};

export const stopSpeaking = () => {
  try {
    Speech.stop();
  } catch (e) {
    // Speech is not available here.
  }
  const callback = activeEnd;
  activeEnd = null;
  session += 1;
  if (callback) callback();
};

// onEnd runs when the speech finishes, is stopped, or cannot play.
export const speak = (text, { rate = NORMAL_RATE, onEnd } = {}) => {
  stopSpeaking();
  const chunks = chunkText(cleanForSpeech(text));
  if (!chunks.length) {
    if (onEnd) onEnd();
    return;
  }

  session += 1;
  const id = session;
  activeEnd = onEnd || null;

  try {
    chunks.forEach((chunk, index) => {
      Speech.speak(chunk, {
        language: 'en-US',
        rate,
        pitch: 1.0,
        onDone: index === chunks.length - 1 ? () => finish(id) : undefined,
        onStopped: () => finish(id),
        onError: () => finish(id),
      });
    });
  } catch (e) {
    finish(id);
  }
};
