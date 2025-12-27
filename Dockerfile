# Dockerfile for Smart City backend
# Builds an image that runs the Flask app with Gunicorn
FROM python:3.11-slim

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system deps for common packages (if needed) and cleanup
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
  && rm -rf /var/lib/apt/lists/*

# Copy only requirements first for better layer caching
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy app source
COPY . /app

# Expose the port the app runs on
EXPOSE 5000

# Environment defaults
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Use Gunicorn for production
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "backend.app:app"]
