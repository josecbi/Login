let cachedToken = null

export async function getCsrfToken() {
    if (cachedToken) {
        return cachedToken
    }

    const res = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
    })

    if (!res.ok) {
        let data = null
        try {
            data = await res.json()
        } catch (err) {
            data = null
        }
        throw new Error(data?.error || 'Failed to fetch CSRF token')
    }

    const data = await res.json()
    cachedToken = data.csrfToken
    return cachedToken
}
