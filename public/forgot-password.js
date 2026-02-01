const form = document.getElementById('forgot-password-form')
const messageContainer = document.getElementById('message-container')
const emailInput = document.getElementById('email')

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

    const email = emailInput.value.trim()

    if (!email) {
        showMessage('Please enter your email address', true)
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
            showMessage(data.error || 'Failed to send reset link', true)
        } else {
            showMessage(data.message || 'Check your email for the reset link', false)
            form.reset()
            setTimeout(() => {
                hideMessage()
            }, 4000)
        }
    } catch (error) {
        showMessage('Failed to process request. Please try again.', true)
        console.error('Error:', error)
    }
})
