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
    const password = String(formData.get('password') || '')

    if (password.length < 8) {
        showMessage(messageDiv, 'Password must be at least 8 characters long', true)
        return
    }

    if (!/[A-Za-z]/.test(password)) {
        showMessage(messageDiv, 'Password must contain at least one letter', true)
        return
    }

    if (!/[A-Z]/.test(password)) {
        showMessage(messageDiv, 'Password must contain at least one uppercase letter', true)
        return
    }

    if (!/[0-9]/.test(password)) {
        showMessage(messageDiv, 'Password must contain at least one number', true)
        return
    }

    if (!/[^A-Za-z0-9\s]/.test(password)) {
        showMessage(messageDiv, 'Password must contain at least one special character', true)
        return
    }

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
                password,
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
        showMessage(messageDiv, err?.message || 'Failed to signup.', true)
    }
}

signupForm.addEventListener('submit', event => {
    event.preventDefault()
    signup(signupForm)
})

