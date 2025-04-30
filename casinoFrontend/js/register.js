const btnReg = document.getElementsByClassName('reg')[0];
const btnLogin = document.getElementById('logBt');

btnReg.addEventListener('click', register);
btnLogin.addEventListener('click',()=>{
    window.location.href = '../login.html';
});

async function register() {
    const email = document.getElementById('email').value;
    const username = document.getElementById('name').value;
    const psw = document.getElementById('psw').value;
    const psw2 = document.getElementById('psw2').value;

    console.log(email, username, psw, psw2);
    if (psw !== psw2) {
        return showAlert('A két jelszó nem egyezik','error');
    }

    const res = await fetch('http://34.51.132.126:3000/api/register', {
        method: "POST",
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({ email, username, psw })
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
        resetInputs();
        showAlert(`${data.message}`,'success');
        setTimeout(() => {
            window.location.href = '../login.html';
        }, 1500);         

    } else if (data.errors) {
        data.errors.forEach(error => {
            showAlert(error.error, 'error');
        });
    } else if (data.error) {
        showAlert(`${data.error}`,'error');
    } else {
        showAlert('Ismeretlen hiba!','error');
    }
}

function resetInputs() {
    document.getElementById('email').value = null;
    document.getElementById('name').value = null;
    document.getElementById('psw').value = null;
    document.getElementById('psw2').value = null;
}