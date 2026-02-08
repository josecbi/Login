import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { doubleCsrf } from 'csrf-csrf'
import { authRouter } from './routers/authRouter.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getConnection } from './db/db.js'
import session from 'express-session'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = 8000
const secret = process.env.LOGIN_SESSION_SECRET

app.set('trust proxy', 1)

const dirname = import.meta.dirname

try {
    const db = await getConnection()
    const schema = await fs.readFile(path.join(dirname, 'db', 'schema.sql'), 'utf-8')
    try {
        await db.exec(schema)
    } catch (error) {
        console.error('❌ Error executing schema:', error.message)
    }
} catch (error) {
    console.error('❌ The file schema could not be read:', new Error(error))
}

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
    : (process.env.BASE_URL ? [process.env.BASE_URL] : [])

app.use(cors({
    origin: allowedOrigins.length ? allowedOrigins : false,
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 60 * 1000
    }
}))

app.use(express.static('public', { index: 'signup.html' }))

const { generateToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET,
    cookieName: 'XSRF-TOKEN',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getTokenFromRequest: (req) => req.headers['x-csrf-token']
})

app.get('/api/csrf-token', (req, res) => {
    const csrfToken = generateToken(req, res)
    res.json({ csrfToken })
})

app.use('/api/auth', doubleCsrfProtection, authRouter)

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ error: 'Invalid CSRF token.' })
    }
    next(err)
})

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`)
})