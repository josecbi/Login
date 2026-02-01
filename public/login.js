const form = document.getElementById('login-form')
const messageContainer = document.getElementById('message-container')

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

async function login(form) {
    const formData = new FormData(form)
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        })

        const data = await res.json()

        if (!res.ok) {
            showMessage(data.error, true)
        } else {
            showMessage(data.message, false)
            setTimeout(() => {
                hideMessage()
            }, 3000)
        }

    } catch (error) {
        showMessage('Failed to login. Please try again.', true)
        console.error('Failed to login', new Error(error))
    }
}
form.addEventListener('submit', async e => {
    e.preventDefault()
    await login(form)
})