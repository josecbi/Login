import { showMessage, hideMessage } from "./utilsFrontEnd/message.js"
import { getCsrfToken } from "./utilsFrontEnd/csrf.js"

const form = document.getElementById('change-password-form')
const messageContainer = document.getElementById('message-container')
const currentPasswordInput = document.getElementById('current-password')
const newPasswordInput = document.getElementById('new-password')
const confirmPasswordInput = document.getElementById('confirm-password')

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    hideMessage(messageContainer)

    const currentPassword = currentPasswordInput.value.trim()
    const newPassword = newPasswordInput.value
    const confirmPassword = confirmPasswordInput.value

    if (!currentPassword || !newPassword || !confirmPassword) {
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
        const res = await fetch('/api/auth/change-password', {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            // Assume server identifies user via session/cookie or auth header
            body: JSON.stringify({ currentPassword, newPassword })
        })

        const data = await res.json()

        if (!res.ok) {
            showMessage(messageContainer, data.error || 'Failed to change password', true)
        } else {
            showMessage(messageContainer, data.message || 'Password changed successfully', false)
            form.reset()
            setTimeout(() => {
                hideMessage(messageContainer)
            }, 3000)
        }
    } catch (error) {
        showMessage(messageContainer, error?.message || 'Failed to change password. Please try again.', true)
        console.error('Error:', error)
    }
})
