// Import the Express library
const express = require('express');
// Import the 'path' library (built-in to Node.js) to help work with file paths
const path = require('path');

// Create an instance of the Express application
const app = express();

// Define the port the server will listen on.
// It first checks for an environment variable 'PORT' (used by Render)
// If 'PORT' is not set (e.g., running locally), it defaults to 3000.
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// Serve static assets from the 'public' directory.
// This will automatically serve 'index.html' for requests to '/'.
app.use(express.static(path.join(__dirname, 'public')));

// --- REMOVED the app.get('*', ...) route ---

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
});