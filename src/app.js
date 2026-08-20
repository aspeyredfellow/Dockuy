const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./config');

const app = express();

// security

// helmet - security headers
app.use(helmet({
    contentSecurityPolicy: false
}));

// cors
app.use(cors({
    origin: config.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// rate limiting - general
app.use(rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS || 900000,
    max: config.RATE_LIMIT_MAX || 100,
    message: 'Too many requests, please try again later.'
}));

// middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// static files
app.use(express.static(path.join(__dirname, 'public')));

// view engine

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// routes

const authRoutes = require('./routes/auth');
const containerRoutes = require('./routes/containers');
const imageRoutes = require('./routes/images');
const systemRoutes = require('./routes/system');

// public routes
app.use('/', authRoutes);

// protected routes (require authentication)
const { authenticate } = require('./middleware/auth');

app.use('/dashboard', authenticate);
app.use('/containers', authenticate);
app.use('/images', authenticate);
app.use('/api/containers', authenticate);
app.use('/api/images', authenticate);
app.use('/api/system', authenticate);

// dashboard
app.get('/dashboard', (req, res) => {
    res.render('dashboard', { 
        title: 'Dashboard | Dockuy',
        active: 'dashboard'
    });
});

// route handlers
app.use('/containers', containerRoutes);
app.use('/images', imageRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/system', systemRoutes);

// 404 handler

app.use((req, res) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.status(404).render('error', { 
        title: '404 | Dockuy',
        message: 'Page not found',
        status: 404
    });
});

// error handler

app.use((err, req, res, next) => {
    console.error('error:', err.stack);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ error: 'internal server error' });
    }
    
    res.status(500).render('error', { 
        title: 'error | dockuy',
        message: err.message || 'something went wrong',
        status: 500
    });
});

module.exports = app;
