// Function to handle logout
async function handleLogout() {
    try {
        // Use the correct path - /api/logout instead of /auth/logout
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Important for including cookies
        });
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            
            if (response.ok) {
                // Clear any local storage or session storage data
                localStorage.removeItem('user');
                sessionStorage.clear();
                
                showAlert(data.message || 'Sikeres kijelentkezés', 'success');
                window.location.href = '/login.html'; // Adjust this to your login page path
            } else {
                showAlert(data.error || 'Hiba történt a kijelentkezés során', 'error');
            }
        } else {
            console.error("Server returned non-JSON response with status:", response.status);
            showAlert(`Hiba történt: ${response.status}`,'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Hiba történt a kijelentkezés során','error');
    }
}

// Add this to your event listener code
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.querySelector('.logoutBt');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});