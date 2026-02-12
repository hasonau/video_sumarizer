const OpenAI = require('openai');
const { chunkText } = require('../utils/text-chunker');
const { CHUNK_SIZE_WORDS } = require('../config/constants');

// Get and clean API key
let apiKey = process.env.OPENAI_API_KEY;
if (apiKey) {
  apiKey = apiKey.trim();
}

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// Initialize OpenAI client
const client = new OpenAI({ 
  apiKey: apiKey
});

/**
 * Summarize a single text chunk
 * @param {string} chunk - Text chunk to summarize
 * @returns {Promise<string>} - Summarized text
 */
async function summarizeChunk(chunk) {
  try {
    const resp = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that creates clear, concise summaries with bullet points." 
        },
        { 
          role: "user", 
          content: `Summarize this text clearly with bullet points:\n${chunk}` 
        }
      ],
      temperature: 0.5,
      max_tokens: 500 // Limit tokens per chunk summary
    });
    
    return resp.choices[0].message.content;
  } catch (error) {
    throw new Error(`Failed to summarize chunk: ${error.message}`);
  }
}

/**
 * Summarize transcript using map-reduce pattern (parallel chunk summarization)
 * @param {string} text - Full transcript text
 * @param {Function} progressCallback - Callback for progress updates (0-1)
 * @returns {Promise<string>} - Final summary
 */
async function summarizeTranscriptMapReduce(text, progressCallback) {
  try {
    // Step 1: Chunk the text
    const chunks = chunkText(text, CHUNK_SIZE_WORDS);
    console.log(`📝 Summarizing ${chunks.length} chunk(s) using map-reduce pattern...`);
    
    if (progressCallback) progressCallback(0.1);
    
    // Step 2: Map phase - Summarize each chunk in parallel
    const chunkPromises = chunks.map(async (chunk, index) => {
      console.log(`  Summarizing chunk ${index + 1}/${chunks.length}...`);
      const summary = await summarizeChunk(chunk);
      if (progressCallback) {
        progressCallback(0.1 + ((index + 1) / chunks.length) * 0.6); // 10-70% for map phase
      }
      return summary;
    });
    
    const chunkSummaries = await Promise.all(chunkPromises);
    
    if (progressCallback) progressCallback(0.7);
    
    // Step 3: Reduce phase - Combine summaries and create final summary
    if (chunks.length > 1) {
      console.log('  Creating final summary from chunk summaries...');
      const combinedSummaries = chunkSummaries.join('\n\n');
      
      if (progressCallback) progressCallback(0.85);
      
      // Final summary pass
      const finalSummary = await summarizeChunk(combinedSummaries);
      
      if (progressCallback) progressCallback(1.0);
      
      return finalSummary;
    }
    
    // If single chunk, return its summary
    if (progressCallback) progressCallback(1.0);
    return chunkSummaries[0];
  } catch (error) {
    throw new Error(`Failed to summarize transcript: ${error.message}`);
  }
}

module.exports = { summarizeTranscriptMapReduce };
