import express from 'express'
import rateLimit from 'express-rate-limit'
import { signup, login, forgotPassword, resetPassword, verifyEmail } from '../controllers/authController.js'
import {
    signupBodySchema,
    verifyEmailBodySchema,
    loginBodySchema,
    forgotPasswordBodySchema,
    resetPasswordBodySchema
} from '../utils/authValidationSchemas.js'
import { validateBody } from '../utils/validateBody.js'

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

authRouter.post('/signup', validateBody(signupBodySchema), signup)
authRouter.post('/login', loginLimiter, validateBody(loginBodySchema), login)
authRouter.post('/forgot-password', forgotPasswordLimiter, validateBody(forgotPasswordBodySchema), forgotPassword)
authRouter.post('/reset-password', validateBody(resetPasswordBodySchema), resetPassword)
authRouter.post('/verify-email', validateBody(verifyEmailBodySchema), verifyEmail)