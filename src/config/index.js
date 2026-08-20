require('dotenv').config();

module.exports = {
    // server
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // auth
    PASSWORD_HASH: process.env.PASSWORD_HASH,
    JWT_SECRET: process.env.JWT_SECRET || 'dockuy-super-secret-key-change-this',
    JWT_EXPIRY: '24h',
    
    // docker
    DOCKER_HOST: process.env.DOCKER_HOST || '/var/run/docker.sock',
    
    // security
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    LOGIN_RATE_LIMIT_MAX: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
    
    // cors
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    
    // session
    COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
};
