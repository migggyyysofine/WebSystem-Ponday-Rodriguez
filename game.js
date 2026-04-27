const ROWS = 8;
const COLS = 8;
let board = [];
let currentScore = 0;
let currentLevel = 1;
let currentTarget = 1200;
let selectedRow = -1, selectedCol = -1;
let isProcessing = false;
let gameActive = false;
let levelPending = false;

const menuOverlay = document.getElementById('startMenu');
const levelModal = document.getElementById('levelModal');
const gridContainer = document.getElementById('game-grid');
const scoreSpan = document.getElementById('score');
const targetSpan = document.getElementById('target');
const levelNumberSpan = document.getElementById('levelNumber');
const statusDiv = document.getElementById('statusMessage');
const resetBtn = document.getElementById('resetButton');
const menuBtn = document.getElementById('menuButton');
const startBtn = document.getElementById('startButton');
const continueBtn = document.getElementById('continueGameBtn');
const menuFromModalBtn = document.getElementById('menuFromModalBtn');
const levelCompleteMsgSpan = document.getElementById('levelCompleteMsg');
const nextTargetSpan = document.getElementById('nextTargetSpan');

const CANDIES = ['🍎', '🍊', '🍇', '🍒', '🍓', '🍉'];

function randomCandy() {
    return CANDIES[Math.floor(Math.random() * CANDIES.length)];
}

function createEmptyBoard() {
    return Array(ROWS).fill().map(() => Array(COLS).fill().map(() => randomCandy()));
}

function getAllMatches(boardData) {
    const matches = [];
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

function clearMatchesAndScore(boardData, addScore = true) {
    const matches = getAllMatches(boardData);
    if (matches.length === 0) return 0;
    
    for (let [r, c] of matches) {
        boardData[r][c] = null;
    }
    
    applyGravityAndRefill(boardData);
    
    if (addScore) {
        const points = matches.length * 10;
        currentScore += points;
        updateScoreUI();
        showStatusMessage(`+${points} points!`, 600);
    }
    return matches.length;
}

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

async function settleMatchesAndRefill(animate = true) {
    let anyCleared = false;
    while (true) {
        const matches = getAllMatches(board);
        if (matches.length === 0) break;
        anyCleared = true;
        if (animate) await animateMatches(matches);
        clearMatchesAndScore(board, true);
        if (animate) await delay(100);
        updateBoardUI();
    }
    if (anyCleared) {
        updateBoardUI();
        checkLevelProgress();
    }
    return anyCleared;
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function updateBoardUI() {
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

function renderGrid() {
    gridContainer.innerHTML = '';
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.textContent = board[i][j];
            tile.setAttribute('data-row', i);
            tile.setAttribute('data-col', j);
            tile.addEventListener('click', ((row, col) => () => onTileClick(row, col)));
            gridContainer.appendChild(tile);
        }
    }
    selectedRow = -1;
    selectedCol = -1;
}

function updateScoreUI() {
    scoreSpan.textContent = currentScore;
}

function updateLevelUI() {
    levelNumberSpan.textContent = currentLevel;
    targetSpan.textContent = currentTarget;
}

function showStatusMessage(msg, duration = 1500) {
    statusDiv.textContent = msg;
    if (duration > 0) {
        setTimeout(() => {
            if (statusDiv.textContent === msg && gameActive && !levelPending) {
                statusDiv.textContent = "✨ Swap tiles! ✨";
            }
        }, duration);
    }
}

function checkLevelProgress() {
    if (!gameActive) return;
    if (levelPending) return;
    
    if (currentScore >= currentTarget) {
        levelPending = true;
        gameActive = false;
        
        levelCompleteMsgSpan.textContent = `You completed Level ${currentLevel}!`;
        const nextTarget = calculateNextTarget(currentTarget);
        nextTargetSpan.textContent = nextTarget;
        levelModal.classList.remove('hidden-modal');
        createConfettiEffect();
        showStatusMessage(`🎉 LEVEL ${currentLevel} COMPLETE! 🎉`, 2000);
    }
}

function calculateNextTarget(currentTargetValue) {
    if (currentTargetValue === 1200) return 2000;
    if (currentTargetValue === 2000) return 3000;
    return currentTargetValue + 1000;
}

function advanceToNextLevel() {
    currentLevel++;
    const nextTargetValue = calculateNextTarget(currentTarget);
    currentTarget = nextTargetValue;
    updateLevelUI();
    gameActive = true;
    levelPending = false;
    showStatusMessage(`⭐ LEVEL ${currentLevel}! Reach ${currentTarget} points! ⭐`, 2500);
}

function createConfettiEffect() {
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'level-up-confetti';
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
        confetti.style.borderRadius = '50%';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-20px';
        document.body.appendChild(confetti);
        
        const destination = window.innerHeight + 50;
        confetti.animate([
            { transform: `translateY(0px) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(${destination}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 1000,
            easing: 'cubic-bezier(0.2, 0.9, 0.4, 1)'
        });
        
        setTimeout(() => {
            if (confetti && confetti.remove) confetti.remove();
        }, 1500);
    }
}

async function trySwap(r1, c1, r2, c2) {
    if (!gameActive || levelPending) {
        showStatusMessage("Level complete! Press CONTINUE to advance!", 1000);
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
        return true;
    } else {
        const tempBack = board[r1][c1];
        board[r1][c1] = board[r2][c2];
        board[r2][c2] = tempBack;
        updateBoardUI();
        showStatusMessage("❌ No match! Try again", 600);
        return false;
    }
}

function onTileClick(row, col) {
    if (!gameActive || levelPending) {
        if (levelPending) showStatusMessage("🎯 Level Complete! Press CONTINUE!", 1200);
        else showStatusMessage("💡 Start game from Menu!", 1000);
        return;
    }
    if (isProcessing) {
        showStatusMessage("⏳ Processing...", 500);
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
    document.querySelectorAll('.tile').forEach(t => t.classList.remove('selected'));
}

function initializeFreshGame() {
    isProcessing = true;
    currentScore = 0;
    currentLevel = 1;
    currentTarget = 1200;
    levelPending = false;
    
    updateScoreUI();
    updateLevelUI();
    
    board = createEmptyBoard();
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
    showStatusMessage("✨ Level 1! Reach 1200 points ✨", 2000);
}

function resetGameHandler() {
    if (levelModal && !levelModal.classList.contains('hidden-modal')) {
        levelModal.classList.add('hidden-modal');
    }
    initializeFreshGame();
}

function showMainMenu() {
    gameActive = false;
    levelPending = false;
    if (levelModal && !levelModal.classList.contains('hidden-modal')) {
        levelModal.classList.add('hidden-modal');
    }
    menuOverlay.classList.remove('hidden-menu');
    clearSelectedHighlight();
    selectedRow = -1;
    selectedCol = -1;
    showStatusMessage("Game in menu. Press PLAY to start!", 1500);
}

function hideMenuAndStart() {
    menuOverlay.classList.add('hidden-menu');
    if (!gameActive || currentScore === 0 && currentLevel === 1) {
        initializeFreshGame();
    } else {
        gameActive = true;
        if (levelPending) levelPending = false;
        showStatusMessage("Resume matching!", 1000);
    }
}

function onContinueLevel() {
    if (levelModal) levelModal.classList.add('hidden-modal');
    advanceToNextLevel();
    gameActive = true;
    levelPending = false;
    showStatusMessage(`Level ${currentLevel} START! Target: ${currentTarget} points`, 2000);
    updateBoardUI();
}

function onMenuFromModal() {
    if (levelModal) levelModal.classList.add('hidden-modal');
    showMainMenu();
}

startBtn.addEventListener('click', hideMenuAndStart);
resetBtn.addEventListener('click', resetGameHandler);
menuBtn.addEventListener('click', showMainMenu);
continueBtn.addEventListener('click', onContinueLevel);
menuFromModalBtn.addEventListener('click', onMenuFromModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (menuOverlay && !menuOverlay.classList.contains('hidden-menu')) {
            e.preventDefault();
            hideMenuAndStart();
        }
    }
});

board = createEmptyBoard();
renderGrid();
currentScore = 0;
currentLevel = 1;
currentTarget = 1200;
updateScoreUI();
updateLevelUI();
gameActive = false;
levelPending = false;
menuOverlay.classList.remove('hidden-menu');
showStatusMessage("🎮 Click PLAY NOW to start matching and level up!", 2500);