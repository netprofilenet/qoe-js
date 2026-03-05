/**
 * Generate cryptographically secure random data
 * @param size - Size in bytes
 * @returns Uint8Array containing random data
 */
export function generateRandomData(size: number): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(size);
  const data = new Uint8Array(buffer);
  const maxChunk = 65536; // Maximum size for getRandomValues

  // Process in chunks to avoid exceeding browser limits
  for (let i = 0; i < size; i += maxChunk) {
    const chunkSize = Math.min(maxChunk, size - i);
    const chunk = new Uint8Array(chunkSize);
    crypto.getRandomValues(chunk);
    data.set(chunk, i);
  }

  return data as Uint8Array<ArrayBuffer>;
}
