//roulette.js
// Wheel initialization and spin functions
import { isAdmin, checkAdminStatus } from './script.js';

function initWheel(){
    var $wheel = $('.roulette-wrapper .wheel'),
        row = "";
     
    row += "<div class='rowRoulette'>";
    row += "  <div class='card red'>1</div>";
    row += "  <div class='card black'>14</div>";
    row += "  <div class='card red'>2</div>";
    row += "  <div class='card black'>13</div>";
    row += "  <div class='card red'>3</div>";
    row += "  <div class='card black'>12</div>";
    row += "  <div class='card red'>4</div>";
    row += "  <div class='card green'>0</div>";
    row += "  <div class='card black'>11</div>";
    row += "  <div class='card red'>5</div>";
    row += "  <div class='card black'>10</div>";
    row += "  <div class='card red'>6</div>";
    row += "  <div class='card black'>9</div>";
    row += "  <div class='card red'>7</div>";
    row += "  <div class='card black'>8</div>";
    row += "</div>";
    for(var x = 0; x < 29; x++){
        $wheel.append(row);
    }
}

async function getBalance() {
    try {
        const response = await fetch('/api/balance', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming token is stored here
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        //console.log("User Balance:", data.balance);

        // If you need to display it somewhere, update the DOM manually
        const balanceElement = document.getElementById('balanceDisplay');
        if (balanceElement) {
            balanceElement.textContent = `Balance: $${data.balance}`;
        }

        return data.balance; // Return balance if needed for further use
    } catch (error) {
        console.error("Failed to fetch balance:", error);
    }
}


function spinWheel(roll){
    var $wheel = $('.roulette-wrapper .wheel'),
        order = [0, 11, 5, 10, 6, 9, 7, 8, 1, 14, 2, 13, 3, 12, 4],
        position = order.indexOf(roll);
           
    //determine position where to land
    var rows = 12,
        card = 75 + 3 * 2,
        landingPosition = (rows * 15 * card) + (position * card);
   
    var randomize = Math.floor(Math.random() * 75) - (75/2);
   
    landingPosition = landingPosition + randomize;
   
    var object = {
        x: Math.floor(Math.random() * 50) / 100,
        y: Math.floor(Math.random() * 20) / 100
    };
    $wheel.css({
        'transition-timing-function':'cubic-bezier(0,'+ object.x +','+ object.y + ',1)',
        'transition-duration':'6s',
        'transform':'translate3d(-'+landingPosition+'px, 0px, 0px)'
    });
    
    // First timeout: Remove transition after spin completes
    setTimeout(function(){
        $wheel.css({
            'transition-timing-function':'',
            'transition-duration':'',
        });
       
        // Wait 3 more seconds before resetting to zero
        setTimeout(function() {
            var resetTo = 0;
           
            // Add transition for smooth reset
            $wheel.css({
                'transition-duration': '.5s',
                'transition-timing-function': 'ease-out',
                'transform': 'translate3d('+resetTo+'px, 0px, 0px)'
            });
        }, 3000); // 3 second pause before reset
    }, 6 * 1000);
}

let socket;
window.addEventListener('socketReady', (e) => {
    socket = e.detail;
});



// Game logic
$(document).ready(function() {
    

    socket.on('bet_placed', (response) => {
        //console.log('Bet response:', response);
        if (response.success) {
            userBet = { amount: response.amount, type: response.type };
            updateBetDisplay(response.amount, response.type);
        } else {
            showAlert(`${response.error || 'Failed to place bet'}`, 'error');
        }
    });

    socket.on('bets_update', (bets) => {
        // Update red bets
        updateBetCard('red', bets.red);
        // Update green bets
        updateBetCard('green', bets.green);
        // Update black bets
        updateBetCard('black', bets.black);
    });

    function updateBetCard(color, betData) {
        const card = document.querySelector(`.${color}Button`).closest('.betCard');
        
        // Clear everything after the betHead
        const betHeadDiv = card.querySelector('.betHead');
        while (betHeadDiv.nextSibling) {
            betHeadDiv.nextSibling.remove();
        }
    
        // Create the main betBody
        const betBody = document.createElement('div');
        betBody.className = 'betBody';
    
        // Add total bet amount (only once)
        betBody.innerHTML = `
            <div class="totalBetAmount">
                <p>Total bet: ${betData.total.toLocaleString()}</p>
            </div>
        `;
    
        // Sort bets by amount in descending order
        const sortedBets = [...betData.bets].sort((a, b) => b.amount - a.amount);

        // Add bet data for each bet
        sortedBets.forEach(bet => {
            const usernameText = isAdmin ? 
            `${bet.username} (${bet.userId})` : 
            `${bet.username}`;
            const betDataDiv = document.createElement('div');
            betDataDiv.className = 'betData';
            betDataDiv.innerHTML = `
                <div class="row customrow">
                    <div class="col-2">
                        <div class="profile-pic">
                            <img src="http://34.51.132.126:3000/uploads/${bet.profilePic}" alt="${bet.username}'s profile">
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="betUserName">
                            <p>${usernameText}</p>
                        </div>    
                    </div>
                    <div class="col-4">
                        <div class="betAmount">
                            <p>${bet.amount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            `;
            betBody.appendChild(betDataDiv);
        });
    
        card.appendChild(betBody);
    }
    
    let isSpinning = false;

    socket.on('connect', () => {
        //console.log('Connected to socket server');
        // Request current game state and bets
        socket.emit('request_game_state');
        socket.emit('request_current_bets');
    });

    socket.on('round_start', (data) => {
        //console.log('Round started:', data);
        currentRoundId = data.roundId;
        updateCountdown(data.timeLeft);
        updateBalance();
        // Clear all bet displays
        ['red', 'green', 'black'].forEach(color => {
            const card = document.querySelector(`.${color}Button`).closest('.betCard');
            const betHeadDiv = card.querySelector('.betHead');
            
            // Remove everything after betHead
            while (betHeadDiv.nextSibling) {
                betHeadDiv.nextSibling.remove();
            }
        });
    });
    
    socket.on('round_end', (data) => {
        //console.log('Round ended:', data);
        isSpinning = true;
        $('#countdown').text('Spinning!');
        $('.redButton, .greenButton, .blackButton').prop('disabled', true);
        spinWheel(data.result);
            // Only show result if user had an active bet with an amount > 0
        if (userBet && userBet.amount > 0 && userBet.type) {
            showResult(data.result, userBet);
        }
        
        // Reset bet after round ends
        userBet = { amount: 0, type: null };
        // Re-enable buttons after spin animation completes
        setTimeout(() => {
            isSpinning = false;
            $('.redButton, .greenButton, .blackButton').prop('disabled', false);
        }, 10000); // Match this with your wheel spin animation duration

    });

    socket.on('time_update', (data) => {
        updateCountdown(data.timeLeft);
    });

    socket.on('update_previous_spins', (data) => {
        //console.log('Received spins data:', data);
        const prevColorsDiv = $('.prevColors');
        prevColorsDiv.empty();
        
        if (data.spins && data.spins.length > 0) {
            data.spins.forEach(spin => {
                //console.log('Processing spin:', spin);
                const spinHtml = `
                    <div class="col-auto text-center">
                        <div class="prevStyle ${spin.winColor}">${spin.winNumber}</div>
                    </div>
                `;
                prevColorsDiv.append(spinHtml);
            });
        }
    });


    let currentRoundId = null;
    let userBet = {
        amount: 0,
        type: null // 'red', 'black', or 'green'
    };

    initWheel();
    if ($('#countdown').length === 0) {
        $('body').append('<div id="countdown"></div>');
    }

    // Handle bet buttons
    $('.redButton, .greenButton, .blackButton').on('click', function() {
        if (isSpinning) {
            showAlert('Cannot place bets while wheel is spinning!', 'error');
            return;
        }

        const amount = parseInt($('#betAmount').val());
        if (isNaN(amount) || amount <= 0) {
            showAlert('Please enter a valid bet amount', 'error');
            return;
        }

        const betType = $(this).hasClass('redButton') ? 'red' : 
                       $(this).hasClass('greenButton') ? 'green' : 'black';

        // Place bet
        placeBet(amount, betType);
    });

    async function placeBet(amount, type) {
        //console.log('Placing bet:', { amount, type, roundId: currentRoundId });
        showAlert(`Placing bet: ${amount} ${type}`,'success');
        socket.emit('place_bet', { 
            amount, 
            type, 
            roundId: currentRoundId 
        });
    }

    function updateBetDisplay(amount, type) {
        // Add UI element to show active bet if not exists
        if ($('#activeBet').length === 0) {
            $('body').append('<div id="activeBet"></div>');
        }
        $('#activeBet').text(`Current bet: ${amount} coins on ${type}`);
    }


    function updateCountdown(time) {
        $('#countdown').text(`${time}`);
    }

    function showResult(result, bet) {
        // Determine if user won
        const isWin = checkWin(result, bet.type);
        const winAmount = isWin ? calculateWinAmount(bet) : 0;

        // Show result to user
        // alert(isWin ? 
        //     `You won ${winAmount} coins!` : 
        //     'Better luck next time!'
        // );

        
        // Update balance display if it exists
    // Delay balance update to occur after wheel spin completes
    }

    function checkWin(result, betType) {
        if (betType === 'green') return result === 0;
        if (betType === 'red') return [1,2,3,4,5,6,7].includes(result);
        if (betType === 'black') return [8,9,10,11,12,13,14].includes(result);
        return false;
    }

    function calculateWinAmount(bet) {
        // Green pays 14x, red/black pays 2x
        const multiplier = bet.type === 'green' ? 14 : 2;
        return bet.amount * multiplier;
    }

});
