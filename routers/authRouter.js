import express from 'express'
import rateLimit from 'express-rate-limit'
import { signup, login, forgotPassword, resetPassword, verifyEmail } from '../controllers/authController.js'

export const authRouter = express.Router()

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
})

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { error: 'Too many password reset requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
})

authRouter.post('/signup', signup)
authRouter.post('/login', loginLimiter, login)
authRouter.post('/forgot-password', forgotPasswordLimiter, forgotPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.post('/verify-email', verifyEmail)