/**
 * Validate YouTube URL
 * @param {string} url - URL to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateYouTubeURL(url) {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL is required and must be a string'
    };
  }

  // Trim whitespace
  url = url.trim();

  // YouTube URL patterns
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/i,
    /^https?:\/\/youtu\.be\/[\w-]+/i,
    /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/i
  ];

  // Check if URL matches any YouTube pattern
  const isValid = youtubePatterns.some(pattern => pattern.test(url));

  if (!isValid) {
    return {
      valid: false,
      error: 'Only YouTube URLs are supported. Please provide a valid YouTube video URL.'
    };
  }

  return {
    valid: true
  };
}

module.exports = { validateYouTubeURL };
