import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Backend URL: Points to the backend service in the same Docker network
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:64039';

console.log(`Starting frontend server...`);
console.log(`Proxying /api requests to: ${BACKEND_URL}`);

// Proxy API requests
app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/': '/api/', // Add /api prefix back since app.use('/api') strips it
    },
    onProxyReq: (proxyReq, req, res) => {
        // console.log(`Proxying ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error: Could not connect to backend.');
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback
// SPA Fallback: Use regex to match all routes to avoid path-to-regexp errors in newer versions
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend server running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });

    // Force close server after 10 secs
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
