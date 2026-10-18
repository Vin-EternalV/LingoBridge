const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const storageDirectory = path.join(__dirname, '..', 'storage', 'private-identity');
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const signatures = [
  { mimeType: 'image/jpeg', extension: '.jpg', matches: (data) => data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[data.length - 2] === 0xff && data[data.length - 1] === 0xd9 },
  { mimeType: 'image/png', extension: '.png', matches: (data) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  { mimeType: 'image/webp', extension: '.webp', matches: (data) => data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' },
];

const getDocumentPath = (key, mimeType) => {
  if (typeof key !== 'string' || !/^[0-9a-f-]{36}$/i.test(key)) return null;
  const type = signatures.find((item) => item.mimeType === mimeType);
  if (!type) return null;
  return path.join(storageDirectory, `${key}${type.extension}`);
};

const parseImage = ({ base64, mimeType }) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('Upload a JPEG, PNG, or WebP image of your government-issued ID.');
  }
  if (typeof base64 !== 'string' || !base64.length || base64.length > Math.ceil(MAX_DOCUMENT_BYTES * 4 / 3) + 8 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
    throw new Error('The ID image is invalid or larger than 5 MB.');
  }
  const data = Buffer.from(base64, 'base64');
  if (!data.length || data.length > MAX_DOCUMENT_BYTES || data.toString('base64') !== base64) {
    throw new Error('The ID image is invalid or larger than 5 MB.');
  }
  const signature = signatures.find((item) => item.mimeType === mimeType && item.matches(data));
  if (!signature) throw new Error('The image contents do not match the selected image type.');
  return { data, signature };
};

const saveDocument = async ({ base64, mimeType }) => {
  const { data, signature } = parseImage({ base64, mimeType });
  await fs.mkdir(storageDirectory, { recursive: true, mode: 0o700 });
  const key = randomUUID();
  const filePath = getDocumentPath(key, signature.mimeType);
  await fs.writeFile(filePath, data, { flag: 'wx', mode: 0o600 });
  return { key, mimeType: signature.mimeType, filePath };
};

const removeDocument = async (key, mimeType) => {
  const filePath = getDocumentPath(key, mimeType);
  if (filePath) await fs.rm(filePath, { force: true });
};

module.exports = { getDocumentPath, saveDocument, removeDocument, MAX_DOCUMENT_BYTES };
