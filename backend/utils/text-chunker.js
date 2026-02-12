/**
 * Chunk text into smaller pieces for processing
 * @param {string} text - Text to chunk
 * @param {number} maxWords - Maximum words per chunk
 * @returns {string[]} - Array of text chunks
 */
function chunkText(text, maxWords = 3000) {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  
  return chunks;
}

module.exports = { chunkText };
