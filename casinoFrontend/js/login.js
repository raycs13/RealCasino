const btnLogin = document.getElementsByClassName('login')[0];
const btnReg = document.getElementById('regBt');

btnLogin.addEventListener('click', login);
btnReg.addEventListener('click',()=>{
    window.location.href = '../register.html';
});

async function login() {
    try {
        const email = document.getElementById('email').value;
        const psw = document.getElementById('psw').value;
        
        const res = await fetch('http://34.51.132.126:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, psw }),
            credentials: 'include'
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Test authentication
            try {
                const checkAuth = await fetch('http://34.51.132.126:3000/api/check-auth', {
                    credentials: 'include'
                });
                const authData = await checkAuth.json();
                console.log('Auth check:', authData);
            } catch (error) {
                console.error('Auth check failed:', error);
            }
            
            resetInputs();
            showAlert(`${data.message}`,'success');
            setTimeout(() => {
                window.location.href = '../main.html';
            }, 1500);       
        } else if (data.errors) {
            data.errors.forEach(error => {
                showAlert(error.error, 'error');
            });
        } else if (data.error) {
            showAlert(`${data.error}`,'error');
        } else {
            showAlert('Ismeretlen hiba','error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Hiba történt a bejelentkezés során','error');
    }
}

function resetInputs() {
    document.getElementById('email').value = null;
    document.getElementById('psw').value = null;
}
