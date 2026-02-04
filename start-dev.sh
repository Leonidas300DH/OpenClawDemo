#!/bin/bash

# Start the server in the background
cd server && node index.js &

echo "Server started on http://localhost:3001"
echo "Starting a simple HTTP server for client on port 3000..."

# Simple Python HTTP server for the client (since Vite has issues)
cd ../client && python3 -m http.server 3000