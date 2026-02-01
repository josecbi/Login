const form = document.getElementById('reset-password-form')
const messageContainer = document.getElementById('message-container')
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

function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('token')
}


window.addEventListener('load', () => {
    const token = getTokenFromURL()
    if (!token) {
        showMessage('Invalid or missing reset link. Please request a new one.', true)
        form.style.display = 'none'
    }
})

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    hideMessage()

    const token = getTokenFromURL()
    const newPassword = newPasswordInput.value
    const confirmPassword = confirmPasswordInput.value

    if (!newPassword || !confirmPassword) {
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
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                newPassword,
                confirmPassword
            })
        })

        const data = await res.json()

        if (!res.ok) {
            showMessage(data.error || 'Failed to reset password', true)
        } else {
            showMessage(data.message || 'Password reset successfully! Redirecting to login...', false)
            setTimeout(() => {
                window.location.href = '/login.html'
            }, 2000)
        }
    } catch (error) {
        showMessage('Failed to reset password. Please try again.', true)
        console.error('Error:', error)
    }
})
