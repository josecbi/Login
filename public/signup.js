import { showMessage } from "./utilsFrontEnd/message.js"
import { getCsrfToken } from "./utilsFrontEnd/csrf.js"

const signupForm = document.getElementById('signup-form')
const messageDiv = document.getElementById('message')

const params = new URLSearchParams(window.location.search)
if (params.get('verified') === '1') {
    showMessage(messageDiv, 'User registered.', false)
}

async function signup(form) {
    const formData = new FormData(form)
    try {
        const csrfToken = await getCsrfToken()
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                termsAgree: formData.get('agree')
            })
        })
        const data = await res.json()

        if (!res.ok) {
            showMessage(messageDiv, data.error, true)
        } else {
            showMessage(messageDiv, data.message, false)
            form.reset()
        }

    } catch (err) {
        showMessage(messageDiv, `Failed to signup. ${err.message}`, true)
    }
}

signupForm.addEventListener('submit', event => {
    event.preventDefault()
    signup(signupForm)
})

