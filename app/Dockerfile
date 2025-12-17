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

# Stage 2: Serve the application with Node.js Proxy
FROM node:18-alpine

WORKDIR /app

# Copy package.json to install production server dependencies
COPY package.json ./

# Install production dependencies (Express + Proxy)
# We only need these for the server script
RUN npm install express http-proxy-middleware

# Copy the build output
COPY --from=build /app/dist /app/dist

# Copy the custom server script
COPY server.js ./server.js

# Expose port 3000
EXPOSE 3000

# Start custom server
CMD ["node", "server.js"]
