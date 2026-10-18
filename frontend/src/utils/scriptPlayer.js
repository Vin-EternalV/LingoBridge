import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

// expo-av plays the server-made audio file on phones (install it with: npx expo install expo-av).
// In a browser the built-in audio element is used instead, so nothing extra is needed on the web.
let ExpoAudio = null;
if (Platform.OS !== 'web') {
  try {
    ExpoAudio = require('expo-av').Audio;
  } catch (e) {
    ExpoAudio = null; // without expo-av the app simply uses the device voice
  }
}

// Reads a listening script aloud with the device's own voices (phone or browser), one sentence group at a time.
// Long text is cut into short pieces because some browsers stop a long utterance after about 15 seconds.

const MAX_CHUNK = 200;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toChunks = (text) => {
  const sentences = String(text).match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [String(text)];
  const chunks = [];
  let current = '';
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (`${current} ${sentence}`.trim().length <= MAX_CHUNK) {
      current = `${current} ${sentence}`.trim();
    } else {
      if (current) chunks.push(current);
      current = sentence;
      while (current.length > MAX_CHUNK) {
        const cut = current.lastIndexOf(' ', MAX_CHUNK);
        const at = cut > 40 ? cut : MAX_CHUNK;
        chunks.push(current.slice(0, at).trim());
        current = current.slice(at).trim();
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
};

const buildQueue = (turns) => {
  const queue = [];
  turns.forEach((turn, t) => {
    const chunks = toChunks(turn.text);
    chunks.forEach((text, i) => {
      queue.push({
        speaker: turn.speaker,
        text,
        endsTurn: i === chunks.length - 1,
        speakerChanges: i === chunks.length - 1 && turns[t + 1] && turns[t + 1].speaker !== turn.speaker,
      });
    });
  });
  return queue;
};

// English voices the device offers, best first. Two different voices make a conversation easier to follow.
const pickVoices = async () => {
  try {
    const all = (await Speech.getAvailableVoicesAsync()) || [];
    const english = all.filter((v) => /^en([-_]|$)/i.test(v.language || ''));
    const seen = new Set();
    const unique = english.filter((v) => (seen.has(v.name) ? false : seen.add(v.name)));
    unique.sort((a, b) => Number(b.quality === 'Enhanced') - Number(a.quality === 'Enhanced'));
    return unique;
  } catch (e) {
    return [];
  }
};

const optionsFor = (speaker, voices) => {
  const hasTwo = voices.length > 1;
  const voice = speaker === 'B' ? (hasTwo ? voices[1] : voices[0]) : voices[0];
  // With only one voice available, speaker B is told apart by a lower pitch.
  const pitch = speaker === 'B' && !hasTwo ? 0.78 : 1.0;
  return { language: 'en-US', rate: 0.95, pitch, ...(voice?.identifier ? { voice: voice.identifier } : {}) };
};

// Speaks one piece and waits until it is finished. If the device never reports "done", a timer moves on.
const speakChunk = (item, voices) =>
  new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, item.text.length * 100 + 4000);
    try {
      Speech.speak(item.text, { ...optionsFor(item.speaker, voices), onDone: finish, onStopped: finish, onError: finish });
    } catch (e) {
      finish();
    }
  });

export const useScriptPlayer = (turns) => {
  const [state, setState] = useState('idle'); // idle | playing | done
  const [progress, setProgress] = useState(0); // 0 to 1
  const [source, setSource] = useState(null); // 'file' (server-made audio) or 'device' (phone or browser voice)
  const run = useRef(0); // changes whenever playback is stopped, so an old loop quits
  const activeFile = useRef(null); // the audio file that is playing right now, if any

  const stop = useCallback(() => {
    run.current += 1;
    if (activeFile.current) activeFile.current.stop();
    try {
      Speech.stop();
    } catch (e) {
      // nothing playing
    }
    setState('idle');
  }, []);

  // Plays the server-made recording. Resolves true when it finished, false if it could not play
  // (the caller then uses the device voice), or null if it was stopped on purpose.
  const playFile = useCallback(
    (url) =>
      new Promise((resolve) => {
        const id = (run.current += 1);
        setSource('file');
        setState('playing');
        setProgress(0);

        let webAudio = null;
        let sound = null;
        let settled = false;

        const dispose = async () => {
          try {
            if (webAudio) {
              webAudio.pause();
              webAudio.removeAttribute('src');
            }
          } catch (e) {
            // already released
          }
          try {
            if (sound) {
              await sound.stopAsync().catch(() => {});
              await sound.unloadAsync().catch(() => {});
            }
          } catch (e) {
            // already released
          }
        };

        const handle = { stop: () => finish(null) };
        const finish = (result) => {
          if (settled) return;
          settled = true;
          if (activeFile.current === handle) activeFile.current = null;
          dispose();
          if (run.current === id) {
            if (result === true) {
              setProgress(1);
              setState('done');
            } else if (result === false) {
              setState('idle');
            }
          }
          resolve(result);
        };
        activeFile.current = handle;

        try {
          if (Platform.OS === 'web') {
            webAudio = new window.Audio(url);
            webAudio.onended = () => finish(true);
            webAudio.onerror = () => finish(false);
            webAudio.ontimeupdate = () => {
              if (webAudio && webAudio.duration) setProgress(Math.min(1, webAudio.currentTime / webAudio.duration));
            };
            webAudio.play().catch(() => finish(false));
          } else if (!ExpoAudio) {
            finish(false);
          } else {
            ExpoAudio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false }).catch(() => {});
            ExpoAudio.Sound.createAsync({ uri: url }, { shouldPlay: true }, (status) => {
              if (!status.isLoaded) {
                if (status.error) finish(false);
                return;
              }
              if (status.durationMillis) setProgress(Math.min(1, status.positionMillis / status.durationMillis));
              if (status.didJustFinish) finish(true);
            })
              .then(({ sound: created }) => {
                sound = created;
                if (settled) dispose(); // stopped while it was still loading
              })
              .catch(() => finish(false));
          }
        } catch (e) {
          finish(false);
        }
      }),
    []
  );

  // Reads the script aloud with the voice built into the phone or browser.
  const play = useCallback(async () => {
    const id = (run.current += 1);
    setSource('device');
    setState('playing');
    setProgress(0);
    const voices = await pickVoices();
    if (run.current !== id) return;
    const queue = buildQueue(turns);
    for (let i = 0; i < queue.length; i += 1) {
      if (run.current !== id) return;
      await speakChunk(queue[i], voices);
      if (run.current !== id) return;
      setProgress((i + 1) / queue.length);
      if (queue[i].endsTurn) await sleep(queue[i].speakerChanges ? 550 : 300);
    }
    if (run.current === id) setState('done');
  }, [turns]);

  // Leaving the screen silences the voice and the recording.
  useEffect(
    () => () => {
      run.current += 1;
      if (activeFile.current) activeFile.current.stop();
      try {
        Speech.stop();
      } catch (e) {
        // nothing playing
      }
    },
    []
  );

  return { state, progress, source, play, playFile, stop };
};
