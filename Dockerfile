# Use official Node.js LTS image
FROM node:23

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev

# Install curl via apt (Debian image)
RUN apt-get update && apt-get install -y curl

# Copy the rest of the app
COPY . .

# Expose application port
EXPOSE 3005

# Start the app (Ensure this matches your setup)
CMD ["node", "server.js"]
