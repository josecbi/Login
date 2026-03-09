import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { getConnection } from '../db/db.js'
import { sendAuthTokenEmail } from '../utilsBackEnd/sendAuthTokenEmail.js'
import { resolveRoleByEmail, syncUserRole } from './roleController.js'

export async function signup(req, res) {
    const { username, email, password } = req.validatedBody

    try {
        const db = await getConnection()
        const alreadyExists = await db.get('SELECT username, email FROM user WHERE username = ? AND email = ?',
            [username, email]
        )

        const pendingExists = await db.get(
            'SELECT id, expires_at FROM pending_users WHERE email = ?',
            [email]
        )

        if (alreadyExists) {
            return res.status(409).json({
                error: 'User already exists.'
            })
        } else if (pendingExists) {
            const now = Math.floor(Date.now() / 1000)
            if (pendingExists.expires_at < now) {
                await db.run('DELETE FROM pending_users WHERE id = ?', [pendingExists.id])
            } else {
                return res.status(409).json({
                    error: 'A verification email was already sent. Please check your email.'
                })
            }
        } else {
            const hashedPass = await bcrypt.hash(password, 10)
            const token = crypto.randomBytes(32).toString('hex')
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
            const expiresAt = Math.floor(Date.now() / 1000) + (60 * 15)

            await db.run(
                'INSERT INTO pending_users (username, email, password, token, expires_at) VALUES (?, ?, ?, ?, ?)',
                [username, email, hashedPass, tokenHash, expiresAt]
            )

            await sendAuthTokenEmail(email, token, username, 'verification', `${req.protocol}://${req.get('host')}`)

            res.status(200).json({ message: 'Verification email sent. Please verify to complete registration.' })
        }

    } catch (error) {
        console.error(new Error(error.message))
        res.status(500).json({ error: 'Registration failed. Please try again.' })
    }

}

export async function verifyEmail(req, res) {
    const { token } = req.validatedBody

    try {
        const db = await getConnection()
        const now = Math.floor(Date.now() / 1000)

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

        const pendingUser = await db.get(
            'SELECT id, username, email, password, expires_at FROM pending_users WHERE token = ?',
            [tokenHash]
        )

        if (!pendingUser) {
            return res.status(404).json({ error: 'Invalid or already used token.' })
        }

        if (pendingUser.expires_at < now) {
            return res.status(401).json({ error: 'Token has expired.' })
        }

        const assignedRole = resolveRoleByEmail(pendingUser.email)

        let result

        try {
            await db.exec('BEGIN')

            result = await db.run(
                'INSERT INTO user (username, email, password, role) VALUES (?, ?, ?, ?)',
                [pendingUser.username, pendingUser.email, pendingUser.password, assignedRole]
            )

            await db.run(
                'INSERT INTO role_audit (user_id, old_role, new_role, changed_by) VALUES (?, ?, ?, ?)',
                [result.lastID, null, assignedRole, 'system-verification']
            )

            await db.run(
                'DELETE FROM pending_users WHERE id = ?',
                [pendingUser.id]
            )

            await db.exec('COMMIT')
        } catch (transactionError) {
            await db.exec('ROLLBACK')
            throw transactionError
        }

        req.session.userId = result.lastID
        req.session.role = assignedRole

        res.status(200).json({ message: 'Account created.' })
    } catch (error) {
        console.error('verifyEmail error:', error)
        res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }
}

export async function login(req, res) {
    const { email, password } = req.validatedBody

    try {
        const db = await getConnection()
        const user = await db.get('SELECT id, username, email, password, role FROM user WHERE email = ?', [email])

        // Generic error message for security (don't reveal if user exists)
        if (!user) {
            return res.status(401).json({ error: 'Email or password is incorrect.' })
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password)
        if (isCorrectPassword) {
            const effectiveRole = await syncUserRole(db, user.id, user.email, user.role, 'system-login')
            req.session.userId = user.id
            req.session.role = effectiveRole
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
    const { email } = req.validatedBody

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

        await sendAuthTokenEmail(email, token, user.username, 'reset', `${req.protocol}://${req.get('host')}`)

        res.status(200).json({ message: 'Password reset link has been sent to your email.' })
    } catch (error) {
        console.error('forgotPassword error:', error)
        res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }
}

export async function resetPassword(req, res) {
    const { token, newPassword } = req.validatedBody

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

        try {
            await db.exec('BEGIN')

            await db.run(
                'UPDATE user SET password = ? WHERE id = ?',
                [hashedPassword, tokenRecord.user_id]
            )

            await db.run(
                'UPDATE tokens SET used_at = ? WHERE id = ?',
                [Math.floor(Date.now() / 1000), tokenRecord.id]
            )

            await db.exec('COMMIT')
        } catch (transactionError) {
            await db.exec('ROLLBACK')
            throw transactionError
        }

        res.status(200).json({ message: 'Password has been reset successfully.' })
    } catch (error) {
        console.error('resetPassword error:', error)
        res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }
}




