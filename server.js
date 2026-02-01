import express, { json } from 'express'
import cors from 'cors'
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

app.use(cors())

app.use(express.json())

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 60 * 1000
    }
}))

app.use(express.static('public', { index: 'signup.html' }))

app.use('/api/auth', authRouter)

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`)
})