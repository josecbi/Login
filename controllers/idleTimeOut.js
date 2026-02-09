const idleTimeoutMs = Number(process.env.IDLE_TIMEOUT)

export const idleTimeout = (req, res, next) => {

    if (!req.session) return next()
    if (!req.session.lastActivity) {
        req.session.lastActivity = Date.now()
        return next()
    }

    const now = Date.now()
    const inactiveTime = now - req.session.lastActivity

    if (inactiveTime > idleTimeoutMs) {
        req.session.destroy(() => {
            res.clearCookie('connect.sid')
            return res.status(401).json({ error: 'Session expired' })
        })
        return
    }

    req.session.lastActivity = now
    next()
}
