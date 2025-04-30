const profileNav = document.getElementById('profileNav');
const homeNav = document.getElementById('homeNav');
const depositNav = document.getElementById('depositNav');

profileNav.addEventListener('click',()=>{
    window.location.href = '../profile.html';
});

depositNav.addEventListener('click',()=>{
    window.location.href = '../payment.html';
});

homeNav.addEventListener('click',()=>{
    window.location.href = '../main.html';
});

