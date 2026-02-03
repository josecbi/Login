import validator from 'validator'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { getConnection } from '../db/db.js'
import { sendVerificationToken } from '../utilsBackEnd/sendVerificationToken.js'

export async function signup(req, res) {

    let { username, email, password, termsAgree } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All field must be filled.' })
    }

    username = username.trim()
    email = email.trim()

    if (!/^[a-zA-Z0-9_-]{1,20}$/.test(username)) {
        return res.status(400).json(
            { error: 'Username must be 1–20 characters, using letters, numbers, _ or -.' }
        )
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email.' })
    }

    if (!termsAgree) {
        return res.status(400).json({ error: 'You must accept terms and conditions.' })
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' })
    }

    try {
        const db = await getConnection()
        const alreadyExists = await db.get('SELECT username, email FROM user WHERE username = ? OR email = ?',
            [username, email]
        )

        if (alreadyExists) {
            return res.status(409).json({
                error: 'User already exists.'
            })
        } else {
            const hashedPass = await bcrypt.hash(password, 10)

            const { lastID } = await db.run('INSERT INTO user (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPass]
            )

            req.session.userId = lastID
            res.status(200).json({ message: 'User registered.' })
        }

    } catch (error) {
        console.error(new Error(error.message))
        res.status(500).json({ error: 'Registration failed. Please try again.' })
    }

}

export async function login(req, res) {
    let { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'All field must be filled.' })
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email.' })
    }

    try {
        const db = await getConnection()
        const user = await db.get('SELECT id, username, password FROM user WHERE email = ?', [email])

        // Generic error message for security (don't reveal if user exists)
        if (!user) {
            return res.status(401).json({ error: 'Email or password is incorrect.' })
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password)
        if (isCorrectPassword) {
            req.session.userId = user.id
            res.status(200).json({ message: `User: ${user.username} logged in successfully!` })
        } else {
            return res.status(401).json({ error: 'Email or password is incorrect.' })
        }
    } catch (error) {
        console.error(new Error(error.message))
        res.status(500).json({ error: 'Login failed. Please try again.' })
    }

}

export async function forgotPassword(req, res) {
    const { email } = req.body

    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email.' })
    }

    try {
        const db = await getConnection()
        const user = await db.get('SELECT id, username FROM user WHERE email = ?', [email])

        if (!user) {
            // Don't reveal if email exists for security
            return res.status(200).json({ message: 'If an account exists with that email, you will receive a password reset link.' })
        }

        const token = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
        const expiresAt = Math.floor(Date.now() / 1000) + (60 * 15)

        await db.run(
            'INSERT INTO tokens (user_id, email, token, token_type, expires_at) VALUES (?, ?, ?, ?, ?)',
            [user.id, email, tokenHash, 'reset', expiresAt]
        )

        await sendVerificationToken(email, token, user.username, 'reset', `${req.protocol}://${req.get('host')}`)

        res.status(200).json({ message: 'Password reset link has been sent to your email.' })
    } catch (error) {
        console.error('forgotPassword error:', error)
        res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }
}

export async function resetPassword(req, res) {
    const { token, newPassword, confirmPassword } = req.body

    if (!token) {
        return res.status(400).json({ error: 'Token is required.' })
    }

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'All fields are required.' })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' })
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' })
    }

    try {
        const db = await getConnection()
        const now = Math.floor(Date.now() / 1000)

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

        const tokenRecord = await db.get(
            'SELECT id, user_id, expires_at FROM tokens WHERE token = ? AND token_type = ? AND used_at IS NULL',
            [tokenHash, 'reset']
        )

        if (!tokenRecord) {
            return res.status(404).json({ error: 'Invalid or already used token.' })
        }

        if (tokenRecord.expires_at < now) {
            return res.status(401).json({ error: 'Token has expired.' })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await db.run(
            'UPDATE user SET password = ? WHERE id = ?',
            [hashedPassword, tokenRecord.user_id]
        )

        await db.run(
            'UPDATE tokens SET used_at = ? WHERE id = ?',
            [Math.floor(Date.now() / 1000), tokenRecord.id]
        )

        res.status(200).json({ message: 'Password has been reset successfully.' })
    } catch (error) {
        console.error('resetPassword error:', error)
        res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }
}


