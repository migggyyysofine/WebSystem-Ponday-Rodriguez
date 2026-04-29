// game.js - Complete Match-3 Game Logic

// ------------------------------
// GAME STATE VARIABLES
// ------------------------------
// ============ SOUND SYSTEM ============
let soundEnabled = true;
let audioCtx = null;

function initAudioOnFirstClick() {
    if (!audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    
    try {
        initAudioOnFirstClick();
        
        const gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
        gainNode.gain.value = 0.15;
        
        if (type === 'match') {
            const osc = audioCtx.createOscillator();
            osc.connect(gainNode);
            osc.frequency.value = 523.25;
            osc.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
            osc.stop(audioCtx.currentTime + 0.2);
        }
        else if (type === 'levelup') {
            const notes = [523.25, 659.25, 783.99];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g);
                g.connect(audioCtx.destination);
                osc.frequency.value = freq;
                g.gain.value = 0.15;
                osc.start(audioCtx.currentTime + i * 0.12);
                g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + i * 0.12 + 0.25);
                osc.stop(audioCtx.currentTime + i * 0.12 + 0.25);
            });
        }
        else if (type === 'click') {
            const osc = audioCtx.createOscillator();
            osc.connect(gainNode);
            osc.frequency.value = 880;
            osc.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
            osc.stop(audioCtx.currentTime + 0.1);
        }
        else if (type === 'error') {
            const osc = audioCtx.createOscillator();
            osc.connect(gainNode);
            osc.frequency.value = 220;
            osc.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
            osc.stop(audioCtx.currentTime + 0.15);
        }
    } catch(e) { console.log('Sound error:', e); }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) {
        soundBtn.textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
    }
}
// In your trySwap function - when match is successful:
async function trySwap(r1, c1, r2, c2) {
    // ... existing code ...
    if (matches.length > 0) {
        playSound('match');  // <-- ADD THIS
        // ... rest of code
    } else {
        playSound('error');  // <-- ADD THIS for invalid swap
        // ... rest of code
    }
}

// In your advanceToNextLevel function:
function advanceToNextLevel() {
    playSound('levelup');  // <-- ADD THIS
    // ... rest of code
}

// In your onTileClick function (when selecting a tile):
function onTileClick(row, col) {
    if (selectedRow === -1) {
        playSound('click');  // <-- ADD THIS
        // ... rest of code
    }
}

// In your createConfettiEffect function (add victory sound):
function createConfettiEffect() {
    playSound('levelup');  // <-- ADD THIS for level completion
    // ... rest of code
}
const ROWS = 8;
const COLS = 8;
let board = [];
let currentScore = 0;
let targetScore = 1500;
let selectedRow = -1, selectedCol = -1;
let isProcessing = false;    // Prevents clicks during match/reset/refill
let gameActive = false;      // Game logic only runs when menu is closed AND game is initialized

// DOM Elements
const menuOverlay = document.getElementById('startMenu');
const gameContainer = document.querySelector('.game-container');
const gridContainer = document.getElementById('game-grid');
const scoreSpan = document.getElementById('score');
const targetSpan = document.getElementById('target');
const statusDiv = document.getElementById('statusMessage');
const resetBtn = document.getElementById('resetButton');
const menuBtn = document.getElementById('menuButton');
const startBtn = document.getElementById('startButton');

// Candy types (emoji based)
const CANDIES = ['🍎', '🍊', '🍇', '🍒', '🍓', '🍉'];

// Helper: random candy
function randomCandy() {
    return CANDIES[Math.floor(Math.random() * CANDIES.length)];
}

// Initialize fresh board (with no initial matches)
function createEmptyBoard() {
    return Array(ROWS).fill().map(() => Array(COLS).fill().map(() => randomCandy()));
}

// Remove matches and resolve until stable
function getAllMatches(boardData) {
    const matches = [];
    // Horizontal matches
    for (let r = 0; r < ROWS; r++) {
        let len = 1;
        for (let c = 1; c <= COLS; c++) {
            if (c < COLS && boardData[r][c] === boardData[r][c-1]) {
                len++;
            } else {
                if (len >= 3) {
                    for (let i = c - len; i < c; i++) {
                        matches.push([r, i]);
                    }
                }
                len = 1;
            }
        }
    }
    // Vertical matches
    for (let c = 0; c < COLS; c++) {
        let len = 1;
        for (let r = 1; r <= ROWS; r++) {
            if (r < ROWS && boardData[r][c] === boardData[r-1][c]) {
                len++;
            } else {
                if (len >= 3) {
                    for (let i = r - len; i < r; i++) {
                        matches.push([i, c]);
                    }
                }
                len = 1;
            }
        }
    }
    return matches;
}

// Apply gravity and refill top with random candies
function applyGravityAndRefill(boardData) {
    for (let c = 0; c < COLS; c++) {
        const columnValues = [];
        for (let r = ROWS-1; r >= 0; r--) {
            if (boardData[r][c] !== null) {
                columnValues.push(boardData[r][c]);
            }
        }
        while (columnValues.length < ROWS) {
            columnValues.push(randomCandy());
        }
        columnValues.reverse();
        for (let r = 0; r < ROWS; r++) {
            boardData[r][c] = columnValues[r];
        }
    }
}

// Clear matches and return total cleared count
function clearMatchesAndScore(boardData, addScore = true) {
    const matches = getAllMatches(boardData);
    if (matches.length === 0) return 0;
    
    // Remove matched positions (set to null)
    for (let [r, c] of matches) {
        boardData[r][c] = null;
    }
    
    // Apply gravity and refill
    applyGravityAndRefill(boardData);
    
    // Add score: each matched tile gives 10 points
    if (addScore) {
        const points = matches.length * 10;
        currentScore += points;
        updateScoreUI();
        showStatusMessage(`+${points} points! Chain reaction!`, 800);
    }
    return matches.length;
}

// Clear matches repeatedly until stable (and accumulate score)
async function settleMatchesAndRefill(animate = true) {
    let anyCleared = false;
    while (true) {
        const matches = getAllMatches(board);
        if (matches.length === 0) break;
        anyCleared = true;
        // mark matched for animation (visual pop)
        if (animate) await animateMatches(matches);
        // clear matches and add score
        clearMatchesAndScore(board, true);
        if (animate) await delay(120);
    }
    if (anyCleared) {
        updateBoardUI();
        checkWinCondition();
    }
    return anyCleared;
}

// Visual animation for matches
async function animateMatches(matches) {
    const tiles = document.querySelectorAll('.tile');
    const matchSet = new Set(matches.map(m => `${m[0]},${m[1]}`));
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const row = parseInt(tile.getAttribute('data-row'));
        const col = parseInt(tile.getAttribute('data-col'));
        if (matchSet.has(`${row},${col}`)) {
            tile.classList.add('match-animation');
        }
    }
    await delay(180);
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].classList.remove('match-animation');
    }
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Update entire grid UI from board array
function updateBoardUI() {
    if (!gridContainer) return;
    const tiles = document.querySelectorAll('.tile');
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const row = parseInt(tile.getAttribute('data-row'));
        const col = parseInt(tile.getAttribute('data-col'));
        tile.textContent = board[row][col];
        tile.classList.remove('selected');
    }
    // clear selection highlight
    selectedRow = -1;
    selectedCol = -1;
}

// Render grid completely
function renderGrid() {
    gridContainer.innerHTML = '';
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.textContent = board[i][j];
            tile.setAttribute('data-row', i);
            tile.setAttribute('data-col', j);
            tile.addEventListener('click', (function(row, col) {
                return function() { onTileClick(row, col); };
            })(i, j));
            gridContainer.appendChild(tile);
        }
    }
    // Reset selected highlight
    selectedRow = -1;
    selectedCol = -1;
}

function updateScoreUI() {
    scoreSpan.textContent = currentScore;
}

function showStatusMessage(msg, duration = 1500) {
    statusDiv.textContent = msg;
    if (duration > 0) {
        setTimeout(() => {
            if (statusDiv.textContent === msg) {
                statusDiv.textContent = gameActive ? "✨ Swap tiles! ✨" : "Game not active. Start from Menu.";
            }
        }, duration);
    }
}

function checkWinCondition() {
    if (currentScore >= targetScore && gameActive) {
        showStatusMessage("🎉 YOU WIN! 🎉 Great matching!", 3000);
        gameActive = false;
        isProcessing = true;
        setTimeout(() => {
            statusDiv.textContent = "🏆 VICTORY! Press New Game or Menu 🏆";
            isProcessing = false;
        }, 500);
    }
}

// Swap logic
async function trySwap(r1, c1, r2, c2) {
    if (!gameActive) {
        showStatusMessage("Game not started! Click Menu & Start", 1000);
        return false;
    }
    if (isProcessing) return false;
    
    // Swap temporarily
    const temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;
    updateBoardUI();
    
    // Check for any matches after swap
    const matches = getAllMatches(board);
    if (matches.length > 0) {
        // Valid swap!
        isProcessing = true;
        await animateMatches(matches);
        clearMatchesAndScore(board, true);
        updateBoardUI();
        await settleMatchesAndRefill(true);
        isProcessing = false;
        return true;
    } else {
        // Invalid swap: revert
        const tempBack = board[r1][c1];
        board[r1][c1] = board[r2][c2];
        board[r2][c2] = tempBack;
        updateBoardUI();
        showStatusMessage("❌ No match! Swap again", 600);
        return false;
    }
}
// ============ OUT OF MOVES DETECTION ============
function hasAnyValidMove() {
    // Check all adjacent tile pairs to see if swapping them would create a match
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // Check right neighbor
            if (c + 1 < COLS) {
                // Try swap with right neighbor
                const temp = board[r][c];
                board[r][c] = board[r][c + 1];
                board[r][c + 1] = temp;
                
                const matches = getAllMatches(board);
                
                // Swap back
                const tempBack = board[r][c];
                board[r][c] = board[r][c + 1];
                board[r][c + 1] = tempBack;
                
                if (matches.length > 0) return true;
            }
            
            // Check down neighbor
            if (r + 1 < ROWS) {
                // Try swap with down neighbor
                const temp = board[r][c];
                board[r][c] = board[r + 1][c];
                board[r + 1][c] = temp;
                
                const matches = getAllMatches(board);
                
                // Swap back
                const tempBack = board[r][c];
                board[r][c] = board[r + 1][c];
                board[r + 1][c] = tempBack;
                
                if (matches.length > 0) return true;
            }
        }
    }
    return false;
}

function checkOutOfMoves() {
    if (!gameActive) return;
    
    if (!hasAnyValidMove()) {
        gameActive = false;
        isProcessing = true;
        showStatusMessage("😢 OUT OF MOVES! 😢 No more swaps possible!", 4000);
        
        // Add a visual indicator on the game board
        const gameGrid = document.getElementById('game-grid');
        if (gameGrid) {
            gameGrid.style.opacity = '0.6';
            gameGrid.style.filter = 'grayscale(0.3)';
        }
        
        setTimeout(() => {
            statusDiv.textContent = "💀 GAME OVER - Out of Moves! Press New Game 💀";
            isProcessing = false;
        }, 500);
        return true;
    }
    return false;
}

// Tile click handler
function onTileClick(row, col) {
    if (!gameActive) {
        showStatusMessage("💡 Open menu and press PLAY to start game!", 1200);
        return;
    }
    if (isProcessing) {
        showStatusMessage("⏳ Processing... Wait", 500);
        return;
    }
    
    if (selectedRow === -1) {
        // First selection
        selectedRow = row;
        selectedCol = col;
        highlightTile(row, col, true);
        showStatusMessage(`Selected ${board[row][col]}`, 800);
    } else {
        // Already selected a tile
        const prevRow = selectedRow, prevCol = selectedCol;
        const isAdjacent = (Math.abs(prevRow - row) + Math.abs(prevCol - col)) === 1;
        
        if (isAdjacent) {
            // attempt swap
            highlightTile(prevRow, prevCol, false);
            trySwap(prevRow, prevCol, row, col).finally(() => {
                // after swap or fail, clear selected highlight
                clearSelectedHighlight();
                selectedRow = -1;
                selectedCol = -1;
            });
        } else {
            // Not adjacent: select new tile
            highlightTile(prevRow, prevCol, false);
            selectedRow = row;
            selectedCol = col;
            highlightTile(row, col, true);
            showStatusMessage(`Selected ${board[row][col]}`, 800);
        }
    }
}

function highlightTile(row, col, highlight) {
    const tiles = document.querySelectorAll('.tile');
    for (let tile of tiles) {
        const r = parseInt(tile.getAttribute('data-row'));
        const c = parseInt(tile.getAttribute('data-col'));
        if (r === row && c === col) {
            if (highlight) tile.classList.add('selected');
            else tile.classList.remove('selected');
        }
    }
}

function clearSelectedHighlight() {
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(t => t.classList.remove('selected'));
}

// Reset full game state (score, fresh board)
async function resetGameAndStart() {
    if (isProcessing) return;
    isProcessing = true;
    currentScore = 0;
    updateScoreUI();
    board = createEmptyBoard();
    // Remove any initial matches by settling
    renderGrid();
    // Resolve board until no matches
    let settled = false;
    while (!settled) {
        const matches = getAllMatches(board);
        if (matches.length === 0) break;
        clearMatchesAndScore(board, false);  // no score for initial cleanup
    }
    // double check no matches remain
    let anyMatch = true;
    while(anyMatch) {
        const m = getAllMatches(board);
        if(m.length===0) break;
        clearMatchesAndScore(board, false);
    }
    renderGrid();
    selectedRow = -1;
    selectedCol = -1;
    gameActive = true;
    isProcessing = false;
    showStatusMessage("🎮 Game Started! Match candies!", 1500);
    checkWinCondition();
}

// Show menu and pause game (gameActive = false)
function showMenu() {
    if (isProcessing) return;
    gameActive = false;
    menuOverlay.classList.remove('hidden-menu');
    // Clear any selected tile highlight
    clearSelectedHighlight();
    selectedRow = -1;
    selectedCol = -1;
    showStatusMessage("Game paused. Press Play to continue or New Game", 1200);
}

// Hide menu, activate game (if game not yet initialized, init fresh)
function hideMenuAndStartGame(resetIfNeeded = false) {
    menuOverlay.classList.add('hidden-menu');
    if (!gameActive || resetIfNeeded) {
        // Initialize fresh game state
        initializeFreshGame();
    } else {
        // just resume active game
        gameActive = true;
        showStatusMessage("Game resumed! Keep matching!", 1000);
    }
}

function initializeFreshGame() {
    // completely reset board & score & active flag
    isProcessing = true;
    currentScore = 0;
    updateScoreUI();
    board = createEmptyBoard();
    // Clear initial matches without scoring
    let changed = true;
    while(changed) {
        const matches = getAllMatches(board);
        if(matches.length === 0) break;
        clearMatchesAndScore(board, false);
    }
    renderGrid();
    selectedRow = -1;
    selectedCol = -1;
    gameActive = true;
    isProcessing = false;
    showStatusMessage("✨ New Game! Swap and Match ✨", 1500);
    checkWinCondition();
}

// New Game from button inside game container
function newGameButtonHandler() {
    if (!gameActive && menuOverlay && !menuOverlay.classList.contains('hidden-menu')) {
        // If menu is open, close it and start fresh
        hideMenuAndStartGame(true);
    } else {
        if (isProcessing) return;
        initializeFreshGame();
    }
}

// Event listeners and initialization (menu shown by default, game container exists but not active)
function setupEventListeners() {
    startBtn.addEventListener('click', () => {
        hideMenuAndStartGame(true);
    });
    resetBtn.addEventListener('click', newGameButtonHandler);
    menuBtn.addEventListener('click', () => {
        if (gameActive) {
            showMenu();
        } else {
            // if already inactive just bring menu
            if (menuOverlay.classList.contains('hidden-menu')) {
                showMenu();
            } else {
                menuOverlay.classList.remove('hidden-menu');
            }
        }
    });
    // Keyboard Enter to start from menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (menuOverlay && !menuOverlay.classList.contains('hidden-menu')) {
                e.preventDefault();
                hideMenuAndStartGame(true);
            }
        }
    });
    // Additional fix: Click outside menu card? Not needed but ensures menu background clicking doesn't hide:
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) {
            // optional: you can start on click background, but we prevent accidental?
            // do nothing - only start via button or Enter
        }
    });
}

// Ensure that on page load, only menu is visible, game container is inactive and no gameplay triggers.
function initialSetup() {
    // Build placeholder board but gameActive = false, no interactions till start.
    board = createEmptyBoard();
    renderGrid();
    currentScore = 0;
    updateScoreUI();
    targetSpan.textContent = targetScore;
    gameActive = false;
    isProcessing = false;
    selectedRow = -1;
    // Menu overlay visible by default
    menuOverlay.classList.remove('hidden-menu');
    showStatusMessage("🎮 Click PLAY NOW to start matching!", 2000);
    // Disable click effect indirectly: onTileClick checks gameActive flag
    setupEventListeners();
}

// Run initial
initialSetup();