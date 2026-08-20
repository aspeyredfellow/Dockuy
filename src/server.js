const app = require('./app');
const config = require('./config');
const bcrypt = require('bcrypt');

if (!config.PASSWORD_HASH) {
    console.error('password hash not set in .env');
    process.exit(1);
}

try {
    bcrypt.compareSync('test', config.PASSWORD_HASH);
} catch (error) {
    console.error('invalid password hash in .env');
    process.exit(1);
}

const PORT = config.PORT || 3000;
app.listen(PORT, () => {
    console.log(`dockuy running on port ${PORT}`);
});