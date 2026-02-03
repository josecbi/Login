import { showMessage, hideMessage } from "./utilsFrontEnd/message.js"
import { getCsrfToken } from "./utilsFrontEnd/csrf.js"

const form = document.getElementById('reset-password-form')
const messageContainer = document.getElementById('message-container')
const newPasswordInput = document.getElementById('new-password')
const confirmPasswordInput = document.getElementById('confirm-password')

function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('token')
}

window.addEventListener('load', () => {
    const token = getTokenFromURL()
    if (!token) {
        showMessage(messageContainer, 'Invalid or missing reset link. Please request a new one.', true)
        form.style.display = 'none'
    }
})

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    hideMessage(messageContainer)

    const token = getTokenFromURL()
    const newPassword = newPasswordInput.value
    const confirmPassword = confirmPasswordInput.value

    if (!newPassword || !confirmPassword) {
        showMessage(messageContainer, 'Please fill in all fields', true)
        return
    }

    if (newPassword.length < 8) {
        showMessage(messageContainer, 'Password must be at least 8 characters long', true)
        return
    }

    if (newPassword !== confirmPassword) {
        showMessage(messageContainer, 'Passwords do not match', true)
        return
    }

    try {
        const csrfToken = await getCsrfToken()
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                token,
                newPassword,
                confirmPassword
            })
        })

        const data = await res.json()

        if (!res.ok) {
            showMessage(messageContainer, data.error || 'Failed to reset password', true)
        } else {
            showMessage(messageContainer, data.message || 'Password reset successfully! Redirecting to login...', false)
            setTimeout(() => {
                window.location.href = '/login.html'
            }, 2000)
        }
    } catch (error) {
        showMessage(messageContainer, 'Failed to reset password. Please try again.', true)
        console.error('Error:', error)
    }
})
