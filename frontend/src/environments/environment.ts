export const environment = {
  production: true,
  // Since we are using Unified Deployment (frontend served by backend),
  // we can use a relative URL to completely avoid CORS issues.
  apiUrl: '/api'
};
