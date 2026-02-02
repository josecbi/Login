export function showMessage(container, message, isError = false) {
    container.textContent = message
    container.className = 'message'
    if (isError) {
        container.classList.add('error')
    } else {
        container.classList.add('success')
    }
}

export function hideMessage(container) {
    container.className = 'message'
    container.textContent = ''
}