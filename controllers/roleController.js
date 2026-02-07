const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)

export function resolveRoleByEmail(email) {
    if (!email) return 'basic'
    return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'basic'
}

export async function syncUserRole(db, userId, email, currentRole, changedBy = 'system') {
    const expectedRole = resolveRoleByEmail(email)
    if (currentRole !== expectedRole) {
        await db.run(
            'UPDATE user SET role = ? WHERE id = ?',
            [expectedRole, userId]
        )
        await db.run(
            'INSERT INTO role_audit (user_id, old_role, new_role, changed_by) VALUES (?, ?, ?, ?)',
            [userId, currentRole || null, expectedRole, changedBy]
        )
    }
    return expectedRole
}
