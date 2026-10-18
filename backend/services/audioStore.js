// Keeps the generated Listening audio files on disk (one WAV per listening test).
// Files are removed when the test is submitted or deleted, when the account is deleted, and after a day.
const fs = require('fs');
const path = require('path');
const cfg = require('../config/tts');

const dir = () => process.env.AUDIO_DIR || path.join(__dirname, '..', 'storage', 'listening-audio');
const isId = (id) => /^[a-f\d]{24}$/i.test(String(id || ''));
const fileFor = (id) => path.join(dir(), `${String(id).toLowerCase()}.wav`);

exports.fileFor = (id) => (isId(id) ? fileFor(id) : null);

exports.save = async (id, buffer) => {
  if (!isId(id)) throw new Error('Invalid audio id');
  await fs.promises.mkdir(dir(), { recursive: true });
  await fs.promises.writeFile(fileFor(id), buffer);
  exports.pruneOld().catch(() => {}); // tidy up in the background
};

exports.exists = async (id) => {
  if (!isId(id)) return false;
  try {
    await fs.promises.access(fileFor(id));
    return true;
  } catch (e) {
    return false;
  }
};

exports.remove = async (id) => {
  if (!isId(id)) return;
  try {
    await fs.promises.unlink(fileFor(id));
  } catch (e) {
    // already gone
  }
};

exports.removeMany = async (ids) => {
  await Promise.all((ids || []).map((id) => exports.remove(id)));
};

// Deletes audio files older than a day (nobody needs a recording after the test).
exports.pruneOld = async () => {
  let names;
  try {
    names = await fs.promises.readdir(dir());
  } catch (e) {
    return 0;
  }
  let removed = 0;
  const cutoff = Date.now() - cfg.keepFilesMs;
  for (const name of names) {
    if (!name.endsWith('.wav')) continue;
    try {
      const full = path.join(dir(), name);
      const stat = await fs.promises.stat(full);
      if (stat.mtimeMs < cutoff) {
        await fs.promises.unlink(full);
        removed += 1;
      }
    } catch (e) {
      // skip files we can't read
    }
  }
  return removed;
};
