let originalData = [];
let hasChanges = false;
let editModal;

window.addEventListener('load', () => {
    editModal = new bootstrap.Modal(document.getElementById('editModal'));
    fetchUsers();
});

async function fetchUsers() {
    try {
        const response = await fetch('/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        originalData = [...data];
        displayUsers(data);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load users');
    }
}

function displayUsers(users) {
    const desktopTbody = document.querySelector('#desktopTableBody');
    const mobileTbody = document.querySelector('#mobileTableBody');
    
    // Sort users by user_id
    users.sort((a, b) => a.user_id - b.user_id);

    // Desktop view
    desktopTbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.user_id}</td>
            <td><input type="text" class="form-control" value="${user.username}" data-userid="${user.user_id}" data-field="username"></td>
            <td><input type="password" class="form-control" placeholder="••••••••" value="" data-userid="${user.user_id}" data-field="password"></td>
            <td><input type="email" class="form-control" value="${user.email}" data-userid="${user.user_id}" data-field="email"></td>
            <td><input type="text" class="form-control" value="${user.role}" data-userid="${user.user_id}" data-field="role"></td>
            <td><input type="number" class="form-control" value="${user.balance}" data-userid="${user.user_id}" data-field="balance"></td>
            <td><button class="btn btn-danger delete-btn" data-userid="${user.user_id}">Delete</button></td>
        </tr>
    `).join('');

    // Mobile view
    mobileTbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.user_id}</td>
            <td>${user.username}</td>
            <td>
                <button class="btn btn-primary btn-sm edit-btn" data-userid="${user.user_id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-btn" data-userid="${user.user_id}">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Handle desktop table input changes
document.querySelector('#desktopTableBody').addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT') {
        hasChanges = true;
        document.querySelector('#saveChanges').style.display = 'block';
    }
});

// Handle edit button clicks (mobile view)
document.querySelector('#mobileTableBody').addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
        const user_id = e.target.dataset.userid;
        const user = originalData.find(u => u.user_id === parseInt(user_id));
        
        // Populate modal
        document.getElementById('editUserId').value = user.user_id;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editPassword').value = ''; // Empty password field
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editRole').value = user.role;
        document.getElementById('editBalance').value = user.balance;
        
        editModal.show();
    }
});

// Handle modal save
// Handle modal save
document.getElementById('saveModalChanges').addEventListener('click', async () => {
    const user_id = parseInt(document.getElementById('editUserId').value);
    const password = document.getElementById('editPassword').value;
    
    // Only include fields that have values
    const updatedUser = {
        user_id,
        username: document.getElementById('editUsername').value,
        email: document.getElementById('editEmail').value,
        role: document.getElementById('editRole').value,
        balance: document.getElementById('editBalance').value
    };
    
    // Only include password if it was changed
    if (password !== '') {
        updatedUser.password = password;
    }

    try {
        // Send update to server
        const response = await fetch(`/users/${user_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUser)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update user');
        }

        // Refresh the data after update
        await fetchUsers();
        editModal.hide();
        
        alert('User updated successfully!');
    } catch (error) {
        console.error('Error updating user:', error);
        alert(`Error: ${error.message}`);
    }
});

// Handle delete button clicks
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this user?')) {
            const user_id = e.target.dataset.userid;
            
            try {
                // Send delete request to server
                const response = await fetch(`/users/${user_id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete user');
                }

                // Update local data
                originalData = originalData.filter(user => user.user_id !== parseInt(user_id));
                displayUsers(originalData);
                
                alert('User deleted successfully!');
            } catch (error) {
                console.error('Error deleting user:', error);
                alert(`Error: ${error.message}`);
            }
        }
    }
});

// For the desktop view - Handle save changes (batch update)
document.querySelector('#saveChanges').addEventListener('click', async () => {
    // Create a map to collect updated users by ID
    const userMap = new Map();
    
    // Process all input fields to collect changes
    const inputs = document.querySelectorAll('#desktopTableBody input');
    inputs.forEach(input => {
        const user_id = parseInt(input.dataset.userid);
        const field = input.dataset.field;
        const value = input.value;
        
        // Skip empty password fields
        if (field === 'password' && value === '') {
            return;
        }
        
        if (!userMap.has(user_id)) {
            // Find the original user data
            const originalUser = originalData.find(u => u.user_id === user_id);
            // Create a new entry in the map with only the ID
            userMap.set(user_id, { user_id });
        }
        
        // Update the specific field
        const user = userMap.get(user_id);
        user[field] = value;
    });
    
    // Convert map to array for API
    const updatedUsers = Array.from(userMap.values());
    
    // If no changes, exit early
    if (updatedUsers.length === 0) {
        alert('No changes to save');
        return;
    }
    try {
        // Process each user update individually
        for (const user of updatedUsers) {
            const response = await fetch(`/users/${user.user_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update user ${user.user_id}`);
            }
        }
        
        // Refresh data from server to get any server-side changes
        await fetchUsers();
        
        hasChanges = false;
        document.querySelector('#saveChanges').style.display = 'none';
        
        alert('All changes saved successfully!');
    } catch (error) {
        console.error('Error saving changes:', error);
        alert(`Error: ${error.message}`);
    }
});