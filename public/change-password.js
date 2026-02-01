const form = document.getElementById('change-password-form')
const messageContainer = document.getElementById('message-container')
const currentPasswordInput = document.getElementById('current-password')
const newPasswordInput = document.getElementById('new-password')
const confirmPasswordInput = document.getElementById('confirm-password')

function showMessage(message, isError = false) {
    messageContainer.textContent = message
    messageContainer.className = 'message'
    if (isError) {
        messageContainer.classList.add('error')
    } else {
        messageContainer.classList.add('success')
    }
}

function hideMessage() {
    messageContainer.className = 'message'
    messageContainer.textContent = ''
}

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    hideMessage()

    const currentPassword = currentPasswordInput.value.trim()
    const newPassword = newPasswordInput.value
    const confirmPassword = confirmPasswordInput.value

    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('Please fill in all fields', true)
        return
    }

    if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters long', true)
        return
    }

    if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match', true)
        return
    }

    try {
        const res = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            // Assume server identifies user via session/cookie or auth header
            body: JSON.stringify({ currentPassword, newPassword })
        })

        const data = await res.json()

        if (!res.ok) {
            showMessage(data.error || 'Failed to change password', true)
        } else {
            showMessage(data.message || 'Password changed successfully', false)
            form.reset()
            setTimeout(() => {
                hideMessage()
            }, 3000)
        }
    } catch (error) {
        showMessage('Failed to change password. Please try again.', true)
        console.error('Error:', error)
    }
})
