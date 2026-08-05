#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing frontend dependencies..."
npm install

echo "Building React SPA..."
npm run build

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Build complete."
