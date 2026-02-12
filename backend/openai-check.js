const OpenAI = require('openai');

/**
 * Check if OpenAI API key is valid and has credits
 * @returns {Promise<Object>} - Status object with valid and message
 */
async function checkOpenAICredits() {
  let apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    apiKey = apiKey.trim();
  }

  if (!apiKey) {
    return {
      valid: false,
      hasCredits: false,
      message: 'OpenAI API key is not configured. Please check your .env file.'
    };
  }

  try {
    const client = new OpenAI({ apiKey: apiKey });
    
    // Try a simple API call to check if key is valid and has credits
    // We'll use a very small model call to minimize cost
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
      
      // If we get a response, the key is valid
      return {
        valid: true,
        hasCredits: true,
        message: 'OpenAI API key is valid and has credits.'
      };
    } catch (apiError) {
      // Check for specific error codes
      if (apiError.status === 401) {
        return {
          valid: false,
          hasCredits: false,
          message: 'Invalid OpenAI API key. The key may be incorrect or expired.'
        };
      }
      
      if (apiError.status === 429) {
        return {
          valid: true,
          hasCredits: false,
          message: 'OpenAI API rate limit exceeded. Please try again later.'
        };
      }
      
      if (apiError.message && apiError.message.includes('insufficient_quota')) {
        return {
          valid: true,
          hasCredits: false,
          message: 'OpenAI API credits are empty. The owner needs to add credits to their OpenAI account.'
        };
      }
      
      if (apiError.message && apiError.message.includes('billing')) {
        return {
          valid: true,
          hasCredits: false,
          message: 'OpenAI API billing issue. Please check your OpenAI account billing settings.'
        };
      }
      
      // Other errors - might be temporary
      return {
        valid: true,
        hasCredits: true, // Assume credits exist for other errors
        message: `OpenAI API check warning: ${apiError.message}`
      };
    }
  } catch (error) {
    return {
      valid: false,
      hasCredits: false,
      message: `Error checking OpenAI API: ${error.message}`
    };
  }
}

module.exports = { checkOpenAICredits };
