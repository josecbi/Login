import { showMessage, hideMessage } from "./utilsFrontEnd/message.js"
import { getCsrfToken } from "./utilsFrontEnd/csrf.js"

const messageContainer = document.getElementById('message-container')

function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('token')
}

async function verifyEmail() {
    hideMessage(messageContainer)
    const token = getTokenFromURL()

    if (!token) {
        showMessage(messageContainer, 'Invalid or missing verification link.', true)
        return
    }

    try {
        const csrfToken = await getCsrfToken()
        const res = await fetch('/api/auth/verify-email', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ token })
        })

        const data = await res.json()

        if (!res.ok) {
            showMessage(messageContainer, data.error || 'Failed to verify email', true)
            return
        }

        const params = new URLSearchParams({ verified: '1' })
        window.location.href = `/signup.html?${params.toString()}`
    } catch (error) {
        showMessage(messageContainer, 'Failed to verify email. Please try again.', true)
        console.error('Error:', error)
    }
}

window.addEventListener('load', () => {
    verifyEmail()
})
