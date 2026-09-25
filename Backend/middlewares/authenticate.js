const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'jwt token not provided/invalid' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || process.env.jwt_secret;
    if (!secret) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json({ msg: 'authentication is not configured' });
    }

    try {
        const payload = jwt.verify(token, secret);
        req.user = { userId: payload.userId, name: payload.name };
        return next();
    } catch (error) {
        return res.status(401).json({ msg: 'authentication invalid' });
    }
};
module.exports = auth
