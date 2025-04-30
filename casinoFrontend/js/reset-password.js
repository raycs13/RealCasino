document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showAlert('Invalid reset link','error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        return;
    }

    document.getElementById('resetPasswordBt').addEventListener('click', async () => {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showAlert('Passwords do not match','error');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('Password must be at least 6 characters long','error');
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Password has been reset successfully','success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                showAlert(`${data.error || 'Failed to reset password'}`,'error');
            }
        } catch (error) {
            showAlert('An error occurred. Please try again.','error');
        }
    });
});