# Stage 1: Build the React application
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with 'serve'
FROM node:18-alpine

WORKDIR /app

# Install 'serve' package globally
RUN npm install -g serve

# Copy density built assets from builder stage
COPY --from=build /app/dist /app/dist

# Expose port 3000
EXPOSE 3000

# Start server
CMD ["serve", "-s", "dist", "-l", "3000"]
