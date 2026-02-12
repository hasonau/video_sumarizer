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

  // Optional: skip pre-check (e.g. if you use pay-as-you-go and the check gives false negatives)
  if (process.env.SKIP_OPENAI_CREDITS_CHECK === 'true') {
    return { valid: true, hasCredits: true, message: 'Credits check skipped (SKIP_OPENAI_CREDITS_CHECK=true).' };
  }

  try {
    const client = new OpenAI({ apiKey: apiKey });
    
    // Try a simple API call to check if key is valid and has credits
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
      
      return {
        valid: true,
        hasCredits: true,
        message: 'OpenAI API key is valid and has credits.'
      };
    } catch (apiError) {
      const status = apiError.status ?? apiError.statusCode;
      const message = apiError.message || String(apiError);
      const code = apiError.code || apiError.error?.code;
      console.warn('[OpenAI credits check] API error:', { status, code, message: message.substring(0, 200) });

      if (status === 401) {
        return {
          valid: false,
          hasCredits: false,
          message: 'Invalid OpenAI API key. The key may be incorrect or expired.'
        };
      }
      
      if (status === 429) {
        return {
          valid: true,
          hasCredits: false,
          message: 'OpenAI API rate limit exceeded. Please try again later.'
        };
      }
      
      // Only treat as "no credits" for clear quota/billing errors
      if (status === 402 || message.includes('insufficient_quota') || (message.includes('billing') && message.toLowerCase().includes('add payment'))) {
        return {
          valid: true,
          hasCredits: false,
          message: 'OpenAI API credits are empty. The owner needs to add credits to their OpenAI account.'
        };
      }
      
      // Other errors (e.g. network, model name) – allow job to run; real error will show at transcribe/summarize
      return {
        valid: true,
        hasCredits: true,
        message: `OpenAI pre-check warning: ${message.substring(0, 100)}`
      };
    }
  } catch (error) {
    console.warn('[OpenAI credits check] Error:', error.message);
    return {
      valid: false,
      hasCredits: false,
      message: `Error checking OpenAI API: ${error.message}`
    };
  }
}

module.exports = { checkOpenAICredits };
