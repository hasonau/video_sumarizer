const OpenAI = require('openai');
const { chunkText } = require('./utils');

// Initialize OpenAI client
let apiKey = process.env.OPENAI_API_KEY;
if (apiKey) {
  apiKey = apiKey.trim();
}

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
          content: "You are a helpful assistant that creates clear, concise summaries." 
        },
        { 
          role: "user", 
          content: `Summarize this text clearly with bullet points:\n${chunk}` 
        }
      ],
      temperature: 0.5
    });
    
    return resp.choices[0].message.content;
  } catch (error) {
    throw new Error(`Failed to summarize chunk: ${error.message}`);
  }
}

/**
 * Summarize transcript by chunking and summarizing each chunk
 * @param {string} text - Full transcript text
 * @returns {Promise<string>} - Final summary
 */
async function summarizeTranscript(text) {
  try {
    // Chunk the text if it's too long
    const chunks = chunkText(text);
    console.log(`Summarizing ${chunks.length} chunk(s)...`);
    
    // Summarize each chunk
    const chunkSummaries = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Summarizing chunk ${i + 1}/${chunks.length}...`);
      const summary = await summarizeChunk(chunks[i]);
      chunkSummaries.push(summary);
    }
    
    // If multiple chunks, create a final summary from all chunk summaries
    if (chunks.length > 1) {
      console.log('Creating final summary from chunk summaries...');
      const combinedSummaries = chunkSummaries.join('\n\n');
      const finalSummary = await summarizeChunk(combinedSummaries);
      return finalSummary;
    }
    
    // If single chunk, return its summary
    return chunkSummaries[0];
  } catch (error) {
    throw new Error(`Failed to summarize transcript: ${error.message}`);
  }
}

module.exports = { summarizeTranscript };
