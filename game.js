// game.js - Complete Match-3 Game Logic with Progressive Levels & Out of Moves Detection

// ------------------------------
// GAME STATE VARIABLES
// ------------------------------
const ROWS = 8;
const COLS = 8;
let board = [];
let currentScore = 0;
let currentLevel = 1;
let targetScore = 1500;
let selectedRow = -1, selectedCol = -1;
let isProcessing = false;
let gameActive = false;
let levelModalActive = false;

// Level targets: progressive difficulty
const levelTargets = {
    1: 1500,
    2: 2500,
    3: 5000,
    4: 8000,
    5: 12000
};

// DOM Elements
const menuOverlay = document.getElementById('startMenu');
const levelModal = document.getElementById('levelModal');
const gameContainer = document.querySelector('.game-container');
const gridContainer = document.getElementById('game-grid');
const scoreSpan = document.getElementById('score');
const targetSpan = document.getElementById('target');
const levelSpan = document.getElementById('levelNumber');
const statusDiv = document.getElementById('statusMessage');
const resetBtn = document.getElementById('resetButton');
const menuBtn = document.getElementById('menuButton');
const startBtn = document.getElementById('startButton');
const continueBtn = document.getElementById('continueGameBtn');
const menuFromModalBtn = document.getElementById('menuFromModalBtn');
const nextTargetSpan = document.getElementById('nextTargetSpan');
const levelCompleteMsg = document.getElementById('levelCompleteMsg');

// Fruit types (emoji based)
const FRUITS = ['🍎', '🍊', '🍇', '🍒', '🍓', '🍉', '🥝', '🍑'];

// Helper: random fruit
function randomFruit() {
    return FRUITS[Math.floor(Math.random() * FRUITS.length)];
}

// Initialize fresh board
function createEmptyBoard() {
    return Array(ROWS).fill().map(() => Array(COLS).fill().map(() => randomFruit()));
}

// Get all matches on board
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

// Apply gravity and refill top with random fruits
function applyGravityAndRefill(boardData) {
    for (let c = 0; c < COLS; c++) {
        const columnValues = [];
        for (let r = ROWS-1; r >= 0; r--) {
            if (boardData[r][c] !== null) {
                columnValues.push(boardData[r][c]);
            }
        }
        while (columnValues.length < ROWS) {
            columnValues.push(randomFruit());
        }
        columnValues.reverse();
        for (let r = 0; r < ROWS; r++) {
            boardData[r][c] = columnValues[r];
        }
    }
}

// Clear matches and return points earned
function clearMatchesAndScore(boardData, addScore = true) {
    const matches = getAllMatches(boardData);
    if (matches.length === 0) return 0;
    
    for (let [r, c] of matches) {
        boardData[r][c] = null;
    }
    
    applyGravityAndRefill(boardData);
    
    if (addScore) {
        let points = matches.length * 10;
        if (matches.length >= 4) points += 20;
        if (matches.length >= 5) points += 50;
        currentScore += points;
        updateScoreUI();
        showStatusMessage(`+${points} points!`, 600);
        return points;
    }
    return matches.length;
}

// Animate matches
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

// Settle matches repeatedly until stable
async function settleMatchesAndRefill(animate = true) {
    let anyCleared = false;
    let maxIterations = 20;
    let iter = 0;
    
    while (iter < maxIterations) {
        const matches = getAllMatches(board);
        if (matches.length === 0) break;
        anyCleared = true;
        if (animate) await animateMatches(matches);
        clearMatchesAndScore(board, true);
        if (animate) await delay(100);
        updateBoardUI();
        iter++;
    }
    
    if (anyCleared) {
        updateBoardUI();
        checkWinCondition();
    }
    return anyCleared;
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Update board UI from board array
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
    selectedRow = -1;
    selectedCol = -1;
}

function updateScoreUI() {
    scoreSpan.textContent = currentScore;
    targetSpan.textContent = targetScore;
    levelSpan.textContent = currentLevel;
}

function showStatusMessage(msg, duration = 1500) {
    statusDiv.textContent = msg;
    if (duration > 0) {
        setTimeout(() => {
            if (statusDiv.textContent === msg) {
                statusDiv.textContent = gameActive ? "✨ Swap fruits! ✨" : "Game not active. Start from Menu.";
            }
        }, duration);
    }
}

// Check if player reached target score for level up
function checkWinCondition() {
    if (currentScore >= targetScore && gameActive && !levelModalActive) {
        showLevelCompleteModal();
    }
}

// ============ OUT OF MOVES DETECTION ============
function hasAnyValidMove() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // Check right neighbor
            if (c + 1 < COLS) {
                const temp = board[r][c];
                board[r][c] = board[r][c + 1];
                board[r][c + 1] = temp;
                const matches = getAllMatches(board);
                const tempBack = board[r][c];
                board[r][c] = board[r][c + 1];
                board[r][c + 1] = tempBack;
                if (matches.length > 0) return true;
            }
            // Check down neighbor
            if (r + 1 < ROWS) {
                const temp = board[r][c];
                board[r][c] = board[r + 1][c];
                board[r + 1][c] = temp;
                const matches = getAllMatches(board);
                const tempBack = board[r][c];
                board[r][c] = board[r + 1][c];
                board[r + 1][c] = tempBack;
                if (matches.length > 0) return true;
            }
        }
    }
    return false;
}

function showOutOfMovesModal() {
    if (!gameActive || levelModalActive) return;
    
    gameActive = false;
    levelModalActive = true;
    
    // Create modal
    const modalDiv = document.createElement('div');
    modalDiv.className = 'out-of-moves-overlay';
    modalDiv.id = 'outOfMovesModal';
    modalDiv.innerHTML = `
        <div class="out-of-moves-card">
            <div class="emoji">😢💀</div>
            <h2>OUT OF MOVES!</h2>
            <p>No more valid matches available!</p>
            <p style="font-size: 14px; margin-top: 10px;">Current Score: ${currentScore}</p>
            <button id="restartGameBtn" class="restart-btn">🔄 RESTART GAME</button>
        </div>
    `;
    document.body.appendChild(modalDiv);
    
    document.getElementById('restartGameBtn').addEventListener('click', () => {
        modalDiv.remove();
        levelModalActive = false;
        initializeFreshGame();
    });
    
    showStatusMessage("😢 OUT OF MOVES! Click RESTART to play again!", 3000);
}

function checkOutOfMoves() {
    if (!gameActive || levelModalActive) return false;
    
    if (!hasAnyValidMove()) {
        showOutOfMovesModal();
        return true;
    }
    return false;
}

// ============ LEVEL SYSTEM ============
function showLevelCompleteModal() {
    if (levelModalActive) return;
    
    gameActive = false;
    levelModalActive = true;
    
    const maxLevel = Math.max(...Object.keys(levelTargets).map(Number));
    
    if (currentLevel >= maxLevel) {
        levelCompleteMsg.textContent = `🏆 AMAZING! YOU BEAT THE GAME! 🏆`;
        nextTargetSpan.textContent = "GAME COMPLETE!";
        continueBtn.textContent = "🏆 VICTORY! 🏆";
        continueBtn.disabled = true;
        continueBtn.style.opacity = "0.5";
    } else {
        const nextTarget = levelTargets[currentLevel + 1];
        nextTargetSpan.textContent = nextTarget;
        levelCompleteMsg.textContent = `You completed Level ${currentLevel}! 🎉`;
        continueBtn.textContent = "▶ NEXT LEVEL";
        continueBtn.disabled = false;
        continueBtn.style.opacity = "1";
    }
    
    levelModal.classList.remove('hidden-modal');
}

function continueToNextLevel() {
    if (currentLevel >= Math.max(...Object.keys(levelTargets).map(Number))) {
        // Game beaten, go to menu
        levelModal.classList.add('hidden-modal');
        levelModalActive = false;
        goToMainMenu();
        return;
    }
    
    currentLevel++;
    targetScore = levelTargets[currentLevel];
    
    // Make game harder: reduce fruit variety (more duplicates = harder to find matches)
    // Or just reset board with current settings
    levelModal.classList.add('hidden-modal');
    levelModalActive = false;
    
    // Reset board for new level with current score
    isProcessing = true;
    board = createEmptyBoard();
    
    // Clear initial matches without scoring
    let settled = false;
    let iterations = 0;
    while (!settled && iterations < 15) {
        const matches = getAllMatches(board);
        if (matches.length === 0) settled = true;
        else clearMatchesAndScore(board, false);
        iterations++;
    }
    
    renderGrid();
    selectedRow = -1;
    selectedCol = -1;
    gameActive = true;
    isProcessing = false;
    updateScoreUI();
    showStatusMessage(`🎉 LEVEL ${currentLevel}! Target: ${targetScore} points! 🎉`, 2000);
    
    // Check for out of moves at start of level
    setTimeout(() => checkOutOfMoves(), 500);
}

function goToMainMenu() {
    levelModal.classList.add('hidden-modal');
    levelModalActive = false;
    gameActive = false;
    menuOverlay.classList.remove('hidden-menu');
    showStatusMessage("Returned to menu. Click PLAY to start from Level 1!", 1500);
}

// ============ SWAP LOGIC ============
async function trySwap(r1, c1, r2, c2) {
    if (!gameActive || levelModalActive) {
        showStatusMessage("Game not active!", 800);
        return false;
    }
    if (isProcessing) return false;
    
    const temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;
    updateBoardUI();
    
    const matches = getAllMatches(board);
    if (matches.length > 0) {
        isProcessing = true;
        await animateMatches(matches);
        clearMatchesAndScore(board, true);
        updateBoardUI();
        await settleMatchesAndRefill(true);
        isProcessing = false;
        
        // Check for win condition
        checkWinCondition();
        
        // Check for out of moves after swap
        if (gameActive && !levelModalActive) {
            setTimeout(() => checkOutOfMoves(), 300);
        }
        return true;
    } else {
        const tempBack = board[r1][c1];
        board[r1][c1] = board[r2][c2];
        board[r2][c2] = tempBack;
        updateBoardUI();
        showStatusMessage("❌ No match! Try again", 500);
        return false;
    }
}

// ============ TILE CLICK HANDLER ============
function onTileClick(row, col) {
    if (!gameActive || levelModalActive) {
        showStatusMessage("Start a game from the menu!", 1000);
        return;
    }
    if (isProcessing) {
        showStatusMessage("Processing... wait", 500);
        return;
    }
    
    if (selectedRow === -1) {
        selectedRow = row;
        selectedCol = col;
        highlightTile(row, col, true);
        showStatusMessage(`Selected ${board[row][col]}`, 600);
    } else {
        const prevRow = selectedRow, prevCol = selectedCol;
        const isAdjacent = (Math.abs(prevRow - row) + Math.abs(prevCol - col)) === 1;
        
        if (isAdjacent) {
            highlightTile(prevRow, prevCol, false);
            trySwap(prevRow, prevCol, row, col).finally(() => {
                clearSelectedHighlight();
                selectedRow = -1;
                selectedCol = -1;
            });
        } else {
            highlightTile(prevRow, prevCol, false);
            selectedRow = row;
            selectedCol = col;
            highlightTile(row, col, true);
            showStatusMessage(`Selected ${board[row][col]}`, 600);
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

// ============ GAME INITIALIZATION ============
async function initializeFreshGame() {
    if (isProcessing) return;
    isProcessing = true;
    
    currentScore = 0;
    currentLevel = 1;
    targetScore = levelTargets[1];
    updateScoreUI();
    
    board = createEmptyBoard();
    
    // Remove initial matches
    let settled = false;
    let iterations = 0;
    while (!settled && iterations < 20) {
        const matches = getAllMatches(board);
        if (matches.length === 0) settled = true;
        else clearMatchesAndScore(board, false);
        iterations++;
    }
    
    renderGrid();
    selectedRow = -1;
    selectedCol = -1;
    gameActive = true;
    levelModalActive = false;
    isProcessing = false;
    showStatusMessage("🎮 Game Started! Match fruits to progress! 🎮", 1500);
    
    // Check for out of moves at start
    setTimeout(() => checkOutOfMoves(), 500);
}

function newGameButtonHandler() {
    if (levelModalActive) {
        levelModal.classList.add('hidden-modal');
        levelModalActive = false;
    }
    initializeFreshGame();
}

function showMenu() {
    if (levelModalActive) {
        levelModal.classList.add('hidden-modal');
        levelModalActive = false;
    }
    gameActive = false;
    menuOverlay.classList.remove('hidden-menu');
    clearSelectedHighlight();
    selectedRow = -1;
    selectedCol = -1;
    showStatusMessage("Game paused. Click PLAY to start from Level 1!", 1200);
}

function hideMenuAndStartGame() {
    menuOverlay.classList.add('hidden-menu');
    initializeFreshGame();
}

// ============ EVENT LISTENERS ============
startBtn.addEventListener('click', hideMenuAndStartGame);
resetBtn.addEventListener('click', newGameButtonHandler);
menuBtn.addEventListener('click', showMenu);
continueBtn.addEventListener('click', continueToNextLevel);
menuFromModalBtn.addEventListener('click', goToMainMenu);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (menuOverlay && !menuOverlay.classList.contains('hidden-menu')) {
            e.preventDefault();
            hideMenuAndStartGame();
        }
    }
});

// Initial setup
board = createEmptyBoard();
renderGrid();
currentScore = 0;
targetScore = levelTargets[1];
updateScoreUI();
gameActive = false;
menuOverlay.classList.remove('hidden-menu');
showStatusMessage("🎮 Click PLAY NOW to start matching! 🎮", 2000);