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
        throw new Error('Failed to fetch CSRF token')
    }

    const data = await res.json()
    cachedToken = data.csrfToken
    return cachedToken
}
