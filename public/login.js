import { showMessage, hideMessage } from "./utilsFrontEnd/message.js"

const form = document.getElementById('login-form')
const messageContainer = document.getElementById('message-container')

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
            showMessage(messageContainer, data.error, true)
        } else {
            showMessage(messageContainer, data.message, false)
            setTimeout(() => {
                hideMessage(messageContainer)
            }, 3000)
        }

    } catch (error) {
        showMessage(messageContainer, 'Failed to login. Please try again.', true)
        console.error('Failed to login', new Error(error))
    }
}
form.addEventListener('submit', async e => {
    e.preventDefault()
    await login(form)
})