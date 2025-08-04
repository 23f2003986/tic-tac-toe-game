document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const boardElement = document.getElementById('game-board');
    const statusElement = document.getElementById('game-status');
    const resetButton = document.getElementById('reset-button');
    const resetScoresButton = document.getElementById('reset-scores-button');
    const playerScoreElement = document.getElementById('player-score');
    const aiScoreElement = document.getElementById('ai-score');
    const drawScoreElement = document.getElementById('draw-score');
    const aboutButton = document.getElementById('about-button');
    const aboutModal = document.getElementById('about-modal');
    const modalCloseButton = document.querySelector('.modal-close-button');
    
    // Mute buttons and their icons
    const muteSfxButton = document.getElementById('mute-sfx-button');
    const muteSfxIcon = muteSfxButton.querySelector('.sfx-icon');
    const muteSfxSlash = muteSfxButton.querySelector('.sfx-slash');
    
    const muteMusicButton = document.getElementById('mute-music-button');
    const muteMusicIcon = muteMusicButton.querySelector('.music-icon');
    const muteMusicSlash = muteMusicButton.querySelector('.music-slash');
    
    // --- Audio Elements ---
    const clickSound = document.getElementById('clickSound');
    const winSound = document.getElementById('winSound');
    const bgMusic = document.getElementById('bgMusic');

    // --- Game State Variables ---
    let board = ['', '', '', '', '', '', '', '', ''];
    let gameOver = false;
    let scores = { player: 0, ai: 0, draws: 0 };
    let sfxMuted = false;
    let musicMuted = true; // Music is off by default
    
    // --- Functions ---
    
    function renderBoard() {
        boardElement.innerHTML = '';
        board.forEach((cell, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = `board-cell flex items-center justify-center text-5xl font-bold rounded-lg ${cell === 'X' ? 'x-marker' : (cell === 'O' ? 'o-marker' : '')}`;
            cellDiv.dataset.index = index;
            cellDiv.textContent = cell;
            
            if (cell !== '') {
                cellDiv.classList.add('animate-pop-in');
            }
            
            boardElement.appendChild(cellDiv);
        });
    }

    async function handlePlayerMove(index) {
        if (gameOver || board[index] !== '') {
            return;
        }

        if (!sfxMuted) {
            clickSound.currentTime = 0;
            clickSound.play();
        }

        const response = await fetch('/api/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cell: parseInt(index) }),
        });

        const data = await response.json();
        
        board = data.board;
        statusElement.textContent = data.status;
        gameOver = data.gameOver;
        scores = data.scores;
        
        renderBoard();
        updateScoreDisplay();
        
        if (gameOver) {
            handleGameEnd(data);
        }
    }
    
    function handleGameEnd(data) {
        if (data.status.includes('Player X wins! Please Reset Game.')) {
            if (!sfxMuted) {
                winSound.play();
            }
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    function updateScoreDisplay() {
        playerScoreElement.textContent = scores.player;
        aiScoreElement.textContent = scores.ai;
        drawScoreElement.textContent = scores.draws;
    }
    
    async function handleReset() {
        const response = await fetch('/api/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        board = data.board;
        statusElement.textContent = data.status;
        gameOver = data.gameOver;
        
        renderBoard();
    }
    
    async function handleResetScores() {
        const response = await fetch('/api/reset_scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        scores = data.scores;
        updateScoreDisplay();
    }

    function toggleSfxMute() {
        sfxMuted = !sfxMuted;
        if (sfxMuted) {
            muteSfxSlash.classList.remove('hidden');
        } else {
            muteSfxSlash.classList.add('hidden');
        }
    }

    function toggleMusicMute() {
        musicMuted = !musicMuted;
        if (musicMuted) {
            bgMusic.pause();
            muteMusicSlash.classList.remove('hidden');
        } else {
            bgMusic.play();
            muteMusicSlash.classList.add('hidden');
        }
    }

    function toggleAboutModal() {
        aboutModal.classList.toggle('hidden');
    }

    // --- Event Listeners ---
    boardElement.addEventListener('click', (event) => {
        const index = event.target.dataset.index;
        if (index !== undefined) {
            handlePlayerMove(index);
        }
    });

    resetButton.addEventListener('click', handleReset);
    resetScoresButton.addEventListener('click', handleResetScores);
    muteSfxButton.addEventListener('click', toggleSfxMute);
    muteMusicButton.addEventListener('click', toggleMusicMute);
    aboutButton.addEventListener('click', toggleAboutModal);
    modalCloseButton.addEventListener('click', toggleAboutModal);
    
    // --- Initialization ---
    renderBoard();
    updateScoreDisplay();
});