// credentials-utils.js

/**
 * Get Google Drive API credentials from the provided JSON file
 * @returns {Object} The credentials object with clientId and apiKey
 */
export const getGoogleDriveCredentials = () => {
  try {
    // Hard-coded credentials from the provided JSON file
    const credentialsData = {
      "web": {
        "client_id": "271313383059-ahcr41l9ck9jg9j3ahck3nnliril3bti.apps.googleusercontent.com",
        "project_id": "upbeat-isotope-465719-q7",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "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",
        "javascript_origins": ["http://localhost:3000"]
      }
    };
    
    const { web } = credentialsData;
    
    if (!web || !web.client_id || !web.client_secret) {
      console.error('Invalid Google Drive credentials format');
      return { clientId: '', apiKey: '' };
    }

    // Add localhost:5174 to the origins to make it work with Vite's default port
    const origins = [...web.javascript_origins, "http://localhost:5174"];
    console.log("Available origins for Google Auth:", origins);

    // For Google Drive API, we don't need the API key for most operations
    // The client ID is sufficient for OAuth authentication
    return {
      clientId: web.client_id,
      apiKey: '', // API key is optional for our use case
      origins
    };
  } catch (error) {
    console.error('Error loading Google Drive credentials:', error);
    return { clientId: '', apiKey: '' };
  }
};

export default { getGoogleDriveCredentials };