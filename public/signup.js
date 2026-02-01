const signupForm = document.getElementById('signup-form')
const messageDiv = document.getElementById('message')

async function signup(form) {
    const formData = new FormData(form)
    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                termsAgree: formData.get('agree')
            })
        })
        const data = await res.json()

        if (!res.ok) {
            messageDiv.textContent = data.error
            messageDiv.className = 'message error'
        } else {
            messageDiv.textContent = data.message
            messageDiv.className = 'message success'
            form.reset()
        }

    } catch (err) {
        messageDiv.textContent = `Failed to signup. ${err.message}`
        messageDiv.className = 'message error'
    }
}

signupForm.addEventListener('submit', event => {
    event.preventDefault()
    signup(signupForm)
})

