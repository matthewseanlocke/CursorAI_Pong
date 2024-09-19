document.addEventListener('DOMContentLoaded', () => {
    generatePongLogo();
    updateDifficultyTextColor(); // Add this line
    // Other initialization code (if any)
});

function generatePongLogo() {
    const pongLogoData = [
        // 0 = empty, 1 = block
        // Each sub-array represents a row
        // The grid represents letters P, O, N, G
        [1,1,1,1,0,  1,1,1,1,0,  1,0,0,1,0,  1,1,1,1],
        [1,0,0,1,0,  1,0,0,1,0,  1,1,0,1,0,  1,0,0,0],
        [1,0,0,1,0,  1,0,0,1,0,  1,0,1,1,0,  1,0,0,0],
        [1,1,1,1,0,  1,0,0,1,0,  1,0,0,1,0,  1,0,1,1],
        [1,0,0,0,0,  1,0,0,1,0,  1,0,0,1,0,  1,0,0,1],
        [1,0,0,0,0,  1,0,0,1,0,  1,0,0,1,0,  1,0,0,1],
        [1,0,0,0,0,  1,1,1,1,0,  1,0,0,1,0,  1,1,1,1],
    ];

    const pongLogo = document.getElementById('pong-logo');

    // Define the new size for the blocks (adjust as needed)
    const blockSize = 40; // Increase this value to make blocks bigger
    
    pongLogoData.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const block = document.createElement('div');
            if (cell === 1) {
                block.classList.add('logo-block');
                block.style.animationDelay = `${(rowIndex + cellIndex) * 0.04}s`;
            } else {
                block.classList.add('logo-space');
            }
            pongLogo.appendChild(block);
        });
    });
    
    // Adjust the overall logo size
    pongLogo.style.display = 'grid';
    pongLogo.style.gridTemplateColumns = `repeat(${pongLogoData[0].length}, ${blockSize}px)`;
    pongLogo.style.gridTemplateRows = `repeat(${pongLogoData.length}, ${blockSize}px)`;
    pongLogo.style.gap = '2px'; // Adjust the gap between blocks if needed
}

// Global Variables
let speedLevel = 0;
let canvas = document.getElementById('game-canvas');
let ctx = canvas.getContext('2d');
let confettiCanvas = document.getElementById('confetti-canvas');
let confettiCtx = confettiCanvas.getContext('2d');
let entryScreen = document.getElementById('entry-screen');
let gameContainer = document.getElementById('game-container');
let insertCoin = document.getElementById('insert-coin');
let difficultyText = document.getElementById('difficulty-text');
let leftArrow = document.getElementById('left-arrow');
let rightArrow = document.getElementById('right-arrow');
let winLoseMessage = document.getElementById('win-lose-message');
let playerScoreElement = document.getElementById('player-score');
let aiScoreElement = document.getElementById('ai-score');
let speedMeter = document.querySelectorAll('.meter-segment');

let difficulties = ['EASY', 'MEDIUM', 'HARD', 'LUDICROUS'];
let difficultyIndex = 0;
let gameParams;
let playerScore = 0;
let aiScore = 0;
let gameLoop;
let ball, playerPaddle, aiPaddle;
let confettiPieces = [];

// Difficulty Settings
const difficultySettings = {
    'EASY': {
        paddleHeightPercent: 0.30,
        aiSpeedPercent: 0.01,
        ballSizePercent: 0.06,
        ballSpeed: { x: 5, y: 4 },
        speedIncreaseFactor: 1.1,
        color: 'yellow'
    },
    'MEDIUM': {
        paddleHeightPercent: 0.20,
        aiSpeedPercent: 0.01,
        ballSizePercent: 0.04,
        ballSpeed: { x: 6.5, y: 5.5 },
        speedIncreaseFactor: 1.15,
        color: 'orange'
    },
    'HARD': {
        paddleHeightPercent: 0.1,
        aiSpeedPercent: 0.01,
        ballSizePercent: 0.03,
        ballSpeed: { x: 8, y: 7 },
        speedIncreaseFactor: 1.2,
        color: 'red'
    },
    'LUDICROUS': {
        paddleHeightPercent: 0.05,
        aiSpeedPercent: 0.015,
        ballSizePercent: 0.005,
        ballSpeed: { x: 12, y: 10 },
        speedIncreaseFactor: 1.3,
        color: 'magenta'
    },
};

// Initialize Game
function initGame() {
    // Set canvas size
    resizeCanvas();

    // Initialize paddles and ball
    let params = gameParams;
    let paddleHeight = canvas.height * params.paddleHeightPercent;
    let paddleWidth = 40;
    let ballRadius = canvas.width * params.ballSizePercent / 2;

    playerPaddle = {
        x: 10,
        y: (canvas.height - paddleHeight) / 2,
        width: paddleWidth,
        height: paddleHeight
    };

    aiPaddle = {
        x: canvas.width - paddleWidth - 10,
        y: (canvas.height - paddleHeight) / 2,
        width: paddleWidth,
        height: paddleHeight,
        speed: canvas.height * params.aiSpeedPercent
    };

    ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: ballRadius,
        speedX: params.ballSpeed.x * (Math.random() > 0.5 ? 1 : -1),
        speedY: params.ballSpeed.y * (Math.random() > 0.5 ? 1 : -1),
        speedIncreaseFactor: params.speedIncreaseFactor
    };
}

// Game Loop
function startGame() {
    gameLoop = setInterval(updateGame, 1000 / 60);
}

// Update Game State
function updateGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dashed center line
    drawCenterLine();

    // Move ball
    moveBall();

    // Move AI paddle
    moveAiPaddle();

    // Draw paddles and ball
    drawPaddle(playerPaddle);
    drawPaddle(aiPaddle);
    drawBall();

    // Check for win condition (changed from 7 to 1)
    if (playerScore >= 2) {
        endGame('WIN');
    } else if (aiScore >= 2) {
        endGame('LOSE');
    }
}

function drawCenterLine() {
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPaddles() {
    // Clear only the areas where the paddles will be drawn
    ctx.clearRect(0, 0, playerPaddle.width + 1, canvas.height);
    ctx.clearRect(canvas.width - aiPaddle.width - 1, 0, aiPaddle.width + 1, canvas.height);
    
    drawPaddle(playerPaddle);
    drawPaddle(aiPaddle);
}

function drawPaddle(paddle) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    // Clear only the area where the ball will be drawn
    ctx.clearRect(ball.x - ball.radius - 1, ball.y - ball.radius - 1, ball.radius * 2 + 2, ball.radius * 2 + 2);
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

// Move Ball
function moveBall() {
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Wall collision (top and bottom)
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
        ball.speedY *= -1;
    }

    // Paddle collision
    if (ball.speedX < 0 && checkCollision(playerPaddle)) {
        ball.speedX *= -1;
        adjustBallSpeed(playerPaddle);
    } else if (ball.speedX > 0 && checkCollision(aiPaddle)) {
        ball.speedX *= -1;
        adjustBallSpeed(aiPaddle);
    }

    // Scoring
    if (ball.x - ball.radius <= 0) {
        // AI scores
        aiScore++;
        updateScoreBoard();
        resetBall('right');
    } else if (ball.x + ball.radius >= canvas.width) {
        // Player scores
        playerScore++;
        updateScoreBoard();
        resetBall('left');
    }

    // Update speed meter every frame
    // updateSpeedMeter();
}

// Check Collision
function checkCollision(paddle) {
    return (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.y + ball.radius > paddle.y
    );
}

// Adjust Ball Speed
function adjustBallSpeed(paddle) {
    let collidePoint = ball.y - (paddle.y + paddle.height / 2);
    collidePoint = collidePoint / (paddle.height / 2);
    let angleRad = (Math.PI / 4) * collidePoint;
    let direction = ball.speedX > 0 ? 1 : -1;

    // Increase speed
    let speed = Math.sqrt(ball.speedX ** 2 + ball.speedY ** 2);
    speed *= ball.speedIncreaseFactor;

    ball.speedX = speed * Math.cos(angleRad) * direction;
    ball.speedY = speed * Math.sin(angleRad);

    // Update speed meter after adjusting ball speed
    updateSpeedMeter();
}

// Move AI Paddle
function moveAiPaddle() {
    let targetY = ball.y - aiPaddle.height / 2;
    if (aiPaddle.y < targetY) {
        aiPaddle.y += aiPaddle.speed;
    } else if (aiPaddle.y > targetY) {
        aiPaddle.y -= aiPaddle.speed;
    }

    // Prevent paddle from going out of bounds
    if (aiPaddle.y < 0) aiPaddle.y = 0;
    if (aiPaddle.y + aiPaddle.height > canvas.height) {
        aiPaddle.y = canvas.height - aiPaddle.height;
    }
}

function resetBall(direction) {
    clearInterval(gameLoop);
    setTimeout(() => {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.speedX = gameParams.ballSpeed.x * (direction === 'left' ? -1 : 1);
        ball.speedY = gameParams.ballSpeed.y * (Math.random() > 0.5 ? 1 : -1);
        // Reset speed level and update speed meter
        speedLevel = 0;
        updateSpeedMeter();
        startGame();
    }, 1000);
}

function initBall(direction) {
    let params = gameParams;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.radius = canvas.width * params.ballSizePercent / 2;
    ball.speedX = params.ballSpeed.x * (direction === 'left' ? -1 : 1);
    ball.speedY = params.ballSpeed.y * (Math.random() > 0.5 ? 1 : -1);
    ball.speedIncreaseFactor = params.speedIncreaseFactor;
    // Reset speed level
    speedLevel = 0;
    updateSpeedMeter();
}

// Update Score Board
function updateScoreBoard() {
    playerScoreElement.textContent = playerScore;
    aiScoreElement.textContent = aiScore;
    // Add animation
    playerScoreElement.classList.add('score-update');
    aiScoreElement.classList.add('score-update');
    setTimeout(() => {
        playerScoreElement.classList.remove('score-update');
        aiScoreElement.classList.remove('score-update');
    }, 500);
}

// Modify the updateSpeedMeter function
function updateSpeedMeter() {
    speedMeter.forEach((segment, index) => {
        if (index < speedLevel) {
            segment.classList.add('active');
        } else {
            segment.classList.remove('active');
        }
    });
}

// Modify the adjustBallSpeed function
function adjustBallSpeed(paddle) {
    let collidePoint = ball.y - (paddle.y + paddle.height / 2);
    collidePoint = collidePoint / (paddle.height / 2);
    let angleRad = (Math.PI / 4) * collidePoint;
    let direction = ball.speedX > 0 ? 1 : -1;

    // Increase speed
    let speed = Math.sqrt(ball.speedX ** 2 + ball.speedY ** 2);
    speed *= ball.speedIncreaseFactor;

    ball.speedX = speed * Math.cos(angleRad) * direction;
    ball.speedY = speed * Math.sin(angleRad);

    // Increase speed level and update speed meter
    speedLevel = Math.min(speedLevel + 1, 10);
    updateSpeedMeter();
}

function resetSpeedMeter() {
    speedMeter.forEach(segment => segment.classList.remove('active'));
}

function endGame(result) {
    clearInterval(gameLoop);
    winLoseMessage.textContent = result === 'WIN' ? 'WINNER!' : 'GAME OVER';
    if (result === 'WIN') {
        winLoseMessage.classList.add('rainbow-text');
        startConfetti();
    } else {
        winLoseMessage.classList.add('flash-red');
    }

    // Clear the canvas to remove the ball
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw the center line and paddles
    drawCenterLine();
    drawPaddle(playerPaddle);
    drawPaddle(aiPaddle);

    setTimeout(() => {
        gameContainer.style.display = 'none';
        entryScreen.style.display = 'flex';
        entryScreen.style.flexDirection = 'column';
        entryScreen.style.justifyContent = 'center';
        entryScreen.style.alignItems = 'center';
        winLoseMessage.className = '';
        resetGame();
    }, 3000);
}

// Reset Game
function resetGame() {
    playerScore = 0;
    aiScore = 0;
    updateScoreBoard();
    resetGameElementPositions();
}

function resetGameElementPositions() {
    const elements = [
        document.getElementById('player-score-container'),
        document.getElementById('ai-score-container'),
        document.getElementById('speed-meter'),
        canvas
    ];

    elements.forEach((el) => {
        el.style.transform = 'translateY(-100vh)';
        el.style.opacity = '0';
        el.style.transition = 'none';
        el.classList.remove('animate');
        // Force a reflow to ensure the changes are applied immediately
        void el.offsetWidth;
    });
}

insertCoin.addEventListener('click', () => {
    entryScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    setDifficulty();
    initGame();
    stopConfetti();
    resetGameElementPositions();
    animateGameElements(() => {
        startGame();
    });
});

leftArrow.addEventListener('click', () => {
    difficultyIndex = (difficultyIndex - 1 + difficulties.length) % difficulties.length;
    updateDifficultyDisplay();
});

rightArrow.addEventListener('click', () => {
    difficultyIndex = (difficultyIndex + 1) % difficulties.length;
    updateDifficultyDisplay();
});

function animateGameElements(callback) {
    const elements = [
        document.getElementById('player-score-container'),
        document.getElementById('ai-score-container'),
        document.getElementById('speed-meter'),
        canvas
    ];

    // Add the game-element class to all elements
    elements.forEach(el => el.classList.add('game-element'));

    // Trigger reflow to ensure the initial state is applied before changing
    void canvas.offsetWidth;

    // Draw the center line immediately
    drawCenterLine();

    // Animate score, speed meter, and canvas elements
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
            el.style.transform = 'translateY(0)';
            el.style.opacity = '1';
            el.classList.add('animate');
        }, index * 300);
    });

    // Animate paddles
    setTimeout(() => {
        playerPaddle.y = (canvas.height - playerPaddle.height) / 2;
        aiPaddle.y = (canvas.height - aiPaddle.height) / 2;
        drawPaddles();
    }, elements.length * 300 + 150);

    // Animate the ball last
    setTimeout(() => {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        drawBall();
    }, elements.length * 300 + 450);

    // Wait for all animations to complete before starting the game
    setTimeout(callback, elements.length * 300 + 750);
}

function updateDifficultyDisplay() {
    let difficulty = difficulties[difficultyIndex];
    difficultyText.textContent = difficulty;
    updateDifficultyTextColor();
}

function updateDifficultyTextColor() {
    let difficulty = difficulties[difficultyIndex];
    difficultyText.style.color = difficultySettings[difficulty].color;
}

function setDifficulty() {
    let difficulty = difficulties[difficultyIndex];
    gameParams = difficultySettings[difficulty];
}

// Mouse and Touch Movement
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('touchmove', handleMove);

function handleMove(e) {
    let rect = canvas.getBoundingClientRect();
    let clientX = e.clientX || (e.touches && e.touches[0].clientX);
    let clientY = e.clientY || (e.touches && e.touches[0].clientY);

    // Calculate the vertical position of the touch or mouse event relative to the canvas
    let scaleY = canvas.height / rect.height;
    let scaleX = canvas.width / rect.width;
    let mouseY = (clientY - rect.top) * scaleY;
    let mouseX = (clientX - rect.left) * scaleX;

    // Check if the device is in portrait or landscape mode
    let isPortrait = window.innerHeight > window.innerWidth;

    if (isPortrait) {
        // In portrait mode, the paddle should respond to horizontal finger movement
        playerPaddle.y = mouseX - playerPaddle.height / 2;
    } else {
        // In landscape mode, the paddle should respond to vertical finger movement
        playerPaddle.y = mouseY - playerPaddle.height / 2;
    }

    // Prevent the paddle from going out of the canvas bounds
    playerPaddle.y = Math.max(0, Math.min(canvas.height - playerPaddle.height, playerPaddle.y));

    // Prevent default behavior to avoid scrolling on mobile
    e.preventDefault();
}

// Window Resize
window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    // Maintain 3:2 aspect ratio
    let width = window.innerWidth;
    let height = window.innerHeight;
    if (width / height > 1.5) {
        width = height * 1.5;
    } else {
        height = width / 1.5;
    }
    canvas.width = width;
    canvas.height = height;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    // Recalculate paddle positions if they are initialized
    if (playerPaddle && aiPaddle) {
        let params = gameParams;
        playerPaddle.height = canvas.height * params.paddleHeightPercent;
        aiPaddle.height = canvas.height * params.paddleHeightPercent;
        playerPaddle.y = (canvas.height - playerPaddle.height) / 2;
        aiPaddle.y = (canvas.height - aiPaddle.height) / 2;
        aiPaddle.x = canvas.width - aiPaddle.width - 10; // Ensure AI paddle's x position is correct

        // Redraw paddles and ball
        drawPaddles();
        drawBall();
    }
}

function stopConfetti() {
    confettiPieces = [];
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

function updateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiPieces.forEach(piece => {
        piece.update();
        piece.draw(confettiCtx);
    });
    if (confettiPieces.length > 0) {
        requestAnimationFrame(updateConfetti);
    }
}

class ConfettiPiece {
    constructor() {
        this.x = Math.random() * confettiCanvas.width;
        this.y = Math.random() * -confettiCanvas.height;
        this.size = Math.random() * 10 + 5;
        this.speedY = Math.random() * 3 + 2;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }
    update() {
        this.y += this.speedY;
        if (this.y > confettiCanvas.height) {
            this.y = Math.random() * -confettiCanvas.height;
            this.x = Math.random() * confettiCanvas.width;
        }
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

function displayWinLoseMessage(isWinner) {
    const winLoseMessage = document.getElementById('win-lose-message');
    if (isWinner) {
        winLoseMessage.textContent = 'You Win!';
        winLoseMessage.classList.add('rainbow-text');
    } else {
        winLoseMessage.textContent = 'Game Over';
        winLoseMessage.classList.remove('rainbow-text');
        winLoseMessage.style.color = 'red';
    }
}

function startConfetti() {
    confettiPieces = Array.from({ length: 100 }, () => new ConfettiPiece());
    updateConfetti();
}