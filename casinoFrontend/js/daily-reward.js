import { updateBalance, updateBalanceDisplay } from './script.js';
document.addEventListener('DOMContentLoaded', function() {
    const dailyRewardButton = document.querySelector('.stats-button');
    
    if (dailyRewardButton) {
        // Check if daily reward is available when page loads
        checkDailyRewardStatus();
        
        // Add click event listener
        dailyRewardButton.addEventListener('click', claimDailyReward);
    }
});

// Function to claim the daily reward
async function claimDailyReward() {
    try {
        const response = await fetch('/api/claim-daily-reward', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success - show notification
            showAlert(`You received ${data.reward} coins! New balance: ${data.newBalance}`,'success');
            updateBalance();
            // Update button state
            updateButtonState(false);
            
            // Update displayed balance if you have it on the page
            const balanceElement = document.getElementById('user-balance');
            if (balanceElement) {
                balanceElement.textContent = data.newBalance;
            }
        } else {
            // Error - already claimed or other error
            if (data.error === 'Already claimed' && data.timeRemaining) {
                const { hours, minutes } = data.timeRemaining;
                showAlert(`You've already claimed today! Next reward in ${hours}h ${minutes}m`,'error');
            } else {
                showAlert(data.error || 'Failed to claim reward','error');
            }
        }
    } catch (error) {
        console.error('Error claiming daily reward:', error);
        showAlert('Network error. Please try again.','error');
    }
}

// Function to check if user can claim reward
async function checkDailyRewardStatus() {
    try {
        const response = await fetch('/api/daily-reward-status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateButtonState(data.canClaim);
            
            if (!data.canClaim && data.timeRemaining) {
                // Add tooltip showing time until next claim
                const { hours, minutes } = data.timeRemaining;
                addTooltip(`Next reward in ${hours}h ${minutes}m`);
            }
        }
    } catch (error) {
        console.error('Error checking reward status:', error);
    }
}

// Function to update button appearance based on availability
function updateButtonState(isAvailable) {
    const button = document.querySelector('.stats-button');
    
    if (isAvailable) {
        button.classList.add('available');
        button.innerHTML = '<i class="fa-solid fa-gift" style="color: white;"></i>';
    } else {
        button.classList.remove('available');
        button.innerHTML = '<i class="fa-solid fa-gift" style="color: white;"></i>';
    }
}

// Helper function to show notifications
function showNotification(type, message) {
    // You can use any notification library or create your own
    // This is a simple example - replace with your preferred method
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`;
    notificationDiv.textContent = message;
    
    document.body.appendChild(notificationDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notificationDiv.remove();
    }, 5000);
}

// Helper function to add tooltip to button
function addTooltip(text) {
    const button = document.querySelector('.stats-button');
    button.setAttribute('title', text);
    
    // If you're using a tooltip library, initialize it here
    // For example: new Tooltip(button);
}