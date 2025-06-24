// Vercel serverless function wrapper
// This file ensures compatibility with Vercel's serverless environment

const app = require('../server');

// Export the Express app for Vercel
module.exports = app;