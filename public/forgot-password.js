import { showMessage, hideMessage } from "./utilsFrontEnd/message.js"

const form = document.getElementById('forgot-password-form')
const messageContainer = document.getElementById('message-container')
const emailInput = document.getElementById('email')

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    hideMessage(messageContainer)

    const email = emailInput.value.trim()

    if (!email) {
        showMessage(messageContainer, 'Please enter your email address', true)
        return
    }

    try {
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        })

        const data = await res.json()

        if (!res.ok) {
            showMessage(messageContainer, data.error || 'Failed to send reset link', true)
        } else {
            showMessage(messageContainer, data.message || 'Check your email for the reset link', false)
            form.reset()
            setTimeout(() => {
                hideMessage(messageContainer)
            }, 4000)
        }
    } catch (error) {
        showMessage(messageContainer, 'Failed to process request. Please try again.', true)
        console.error('Error:', error)
    }
})
