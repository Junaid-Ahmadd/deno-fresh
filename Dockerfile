# Use the latest Deno image
FROM denoland/deno:latest

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Cache dependencies
RUN deno cache main.ts

# Build command for Fresh (including Tailwind)
RUN deno task build

# Run the application
CMD ["deno", "task", "start"]

# Expose the application port
EXPOSE 8000