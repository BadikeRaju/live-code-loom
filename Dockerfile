# ==========================================
# Stage 1: Build the React Frontend (Node.js)
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source code
COPY . .

# Build the React application to the /app/dist directory
RUN npm run build


# ==========================================
# Stage 2: Run the Django Backend (Python)
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# Prevent Python from writing .pyc files to disk and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (e.g., for MySQL client)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django application code
COPY . .

# Copy the built React assets from the builder stage
COPY --from=builder /app/dist /app/dist

# Expose the port Daphne will run on
EXPOSE 1234

# Set the environment variable for Daphne
ENV DJANGO_SETTINGS_MODULE=coflux.settings
ENV PORT=1234

# Start the Daphne server
CMD daphne -b 0.0.0.0 -p $PORT coflux.asgi:application
