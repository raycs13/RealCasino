const alerts = [];
const ALERT_HEIGHT = 70; // Height of alert + margin
const MAX_ALERTS = 3; // Maximum alerts before throttling
const THROTTLE_TIMEOUT = 5000; // 5 seconds timeout after reaching max alerts

// Track alert count and throttling status
let alertCount = 0;
let isThrottled = false;
let throttleTimer = null;

function showAlert(message, type) {
    // Check if alerts are currently throttled
    if (isThrottled) {
        console.log('Alert throttled: Too many alerts. Please wait.');
        return; // Don't show the alert if throttled
    }
    
    // Increment alert count
    alertCount++;
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    // Add alert to document and alerts array
    document.body.appendChild(alert);
    alerts.push(alert);
    
    // Trigger animation after a small delay to ensure proper transition
    setTimeout(() => {
        repositionAlerts();
    }, 10);
    
    // Remove alert after 4 seconds
    setTimeout(() => {
        removeAlert(alert);
    }, 4000);
    
    // Check if we need to throttle
    if (alertCount >= MAX_ALERTS) {
        // Enable throttling
        isThrottled = true;
        
        // Set a timer to reset throttling after the timeout period
        throttleTimer = setTimeout(() => {
            isThrottled = false;
            alertCount = 0;
            console.log('Alert throttling disabled');
        }, THROTTLE_TIMEOUT);
    }
}

function repositionAlerts() {
    alerts.forEach((alert, index) => {
        // Calculate position for each alert
        const topPosition = 20 + (index * ALERT_HEIGHT);
        alert.style.top = topPosition + 'px';
        alert.classList.add('show');
    });
}

function removeAlert(alert) {
    const index = alerts.indexOf(alert);
    if (index > -1) {
        // Start slide out animation
        alert.classList.remove('show');
        alert.style.top = '-100px';
        
        // Remove from array
        alerts.splice(index, 1);
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            alert.remove();
            // Reposition remaining alerts
            repositionAlerts();
        }, 500);
    }
}