const { verifyPassword, generateToken } = require('../middleware/auth');
const config = require('../config');

// show login page
const showLogin = (req, res) => {
    res.render('login', { 
        title: 'Login | Dockuy',
        error: null,
        layout: false
    });
};

// handle login
const login = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.render('login', {
            title: 'Login | Dockuy',
            error: 'Please enter your password',
            layout: false
        });
    }

    const isValid = await verifyPassword(password);

    if (!isValid) {
        return res.render('login', {
            title: 'Login | Dockuy',
            error: 'Invalid password',
            layout: false
        });
    }

    // generate token
    const token = generateToken();

    // set cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: config.COOKIE_MAX_AGE
    });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true });
    }

    res.redirect('/dashboard');
};

// logout
const logout = (req, res) => {
    res.clearCookie('token');
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true });
    }
    
    res.redirect('/login');
};

module.exports = {
    showLogin,
    login,
    logout
};
