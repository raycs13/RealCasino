document.getElementById('resetRequestBt').addEventListener('click', async () => {
    const email = document.getElementById('email').value;

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Password reset link has been sent to your email.','success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showAlert(`${data.error || 'Failed to send reset link'}`, 'error');
        }
    } catch (error) {
        showAlert('An error occurred. Please try again.','error');
    }
});