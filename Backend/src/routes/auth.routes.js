const express = require('express');
const authControllers = require("../controllers/auth.controller")
const { createRateLimitMiddleware } = require('../middlewares/rate-limit.middleware');
const router = express.Router();

const authRateLimiter = createRateLimitMiddleware({
    name: 'auth-routes',
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: 'Too many authentication attempts. Please try again in a few minutes.'
});

router.post("/register", authRateLimiter, authControllers.registerUser)
router.post("/login", authRateLimiter, authControllers.loginUser)



module.exports = router;
