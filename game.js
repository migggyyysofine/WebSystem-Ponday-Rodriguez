// Game configuration
const ROWS = 8;
const COLS = 8;
const TARGET_SCORE = 1200;
const TILE_TYPES = ['⭐', '🍀', '❤️', '💎', '🪄', '🔥'];

let grid = [];
let currentScore = 0;
let gameActive = true;
let selectedRow = -1;
let selectedCol = -1;
let isProcessing = false;

// Initialize the game grid
function initGrid() {
    grid = [];
    for(let i = 0; i < ROWS; i++) {
        grid[i] = [];
        for(let j = 0; j < COLS; j++) {
            grid[i][j] = Math.floor(Math.random() * TILE_TYPES.length);
        }
    }
}

// Render the grid to HTML with click events
function renderGrid() {
    const gridContainer = document.getElementById('game-grid');
    if(!gridContainer) return;
    gridContainer.innerHTML = '';
    
    for(let i = 0; i < ROWS; i++) {
        for(let j = 0; j < COLS; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.textContent = TILE_TYPES[grid[i][j]];
            
            // Highlight selected tile
            if(selectedRow === i && selectedCol === j) {
                tile.classList.add('selected');
            }
            
            tile.addEventListener('click', () => onTileClick(i, j));
            gridContainer.appendChild(tile);
        }
    }
}

// Check for matches in the grid
function checkMatches() {
    let matches = [];
    
    // Check horizontal matches
    for(let row = 0; row < ROWS; row++) {
        let count = 1;
        for(let col = 1; col < COLS; col++) {
            if(grid[row][col] === grid[row][col-1]) {
                count++;
            } else {
                if(count >= 3) {
                    for(let i = 0; i < count; i++) {
                        matches.push({row: row, col: col-1-i});
                    }
                }
                count = 1;
            }
        }
        if(count >= 3) {
            for(let i = 0; i < count; i++) {
                matches.push({row: row, col: COLS-1-i});
            }
        }
    }
    
    // Check vertical matches
    for(let col = 0; col < COLS; col++) {
        let count = 1;
        for(let row = 1; row < ROWS; row++) {
            if(grid[row][col] === grid[row-1][col]) {
                count++;
            } else {
                if(count >= 3) {
                    for(let i = 0; i < count; i++) {
                        matches.push({row: row-1-i, col: col});
                    }
                }
                count = 1;
            }
        }
        if(count >= 3) {
            for(let i = 0; i < count; i++) {
                matches.push({row: ROWS-1-i, col: col});
            }
        }
    }
    
    return matches;
}

// Apply gravity to make tiles fall down
function applyGravity() {
    for(let col = 0; col < COLS; col++) {
        const columnValues = [];
        
        // Collect non-empty tiles from bottom to top
        for(let row = ROWS - 1; row >= 0; row--) {
            if(grid[row][col] !== -1) {
                columnValues.push(grid[row][col]);
            }
        }
        
        // Fill missing spots with new random tiles
        while(columnValues.length < ROWS) {
            columnValues.push(Math.floor(Math.random() * TILE_TYPES.length));
        }
        
        // Put back in reverse order
        columnValues.reverse();
        for(let row = 0; row < ROWS; row++) {
            grid[row][col] = columnValues[row];
        }
    }
}

// Remove matched tiles and add score
function removeMatches(matches) {
    if(matches.length === 0) return 0;
    
    const pointsEarned = matches.length * 10;
    currentScore += pointsEarned;
    document.getElementById('score').textContent = currentScore;
    
    // Clear matched tiles
    for(let match of matches) {
        grid[match.row][match.col] = -1;
    }
    
    // Apply gravity
    applyGravity();
    
    return pointsEarned;
}

// Update status message
function updateStatusMessage(message, isError = false) {
    const statusDiv = document.getElementById('statusMessage');
    if(statusDiv) {
        statusDiv.textContent = message;
        if(isError) {
            statusDiv.style.backgroundColor = '#f44336';
            setTimeout(() => {
                if(statusDiv) statusDiv.style.backgroundColor = '#333';
            }, 1000);
        } else {
            statusDiv.style.backgroundColor = '#333';
        }
    }
}

// Check if player has won
function checkWin() {
    if(currentScore >= TARGET_SCORE) {
        gameActive = false;
        updateStatusMessage('🎉 VICTORY! You reached the target score! 🎉');
        showGameOverMessage(true);
        return true;
    }
    return false;
}

// Helper function to swap and test
function swapAndTest(row1, col1, row2, col2) {
    const temp = grid[row1][col1];
    grid[row1][col1] = grid[row2][col2];
    grid[row2][col2] = temp;
}

// Check if any valid moves remain
function hasValidMoves() {
    for(let row = 0; row < ROWS; row++) {
        for(let col = 0; col < COLS; col++) {
            // Try swapping right
            if(col + 1 < COLS) {
                swapAndTest(row, col, row, col + 1);
                let matches = checkMatches();
                swapAndTest(row, col, row, col + 1);
                if(matches.length > 0) return true;
            }
            
            // Try swapping down
            if(row + 1 < ROWS) {
                swapAndTest(row, col, row + 1, col);
                let matches = checkMatches();
                swapAndTest(row, col, row + 1, col);
                if(matches.length > 0) return true;
            }
        }
    }
    return false;
}

// Show game over message
function showGameOverMessage(isWin) {
    // Remove any existing modal first
    const existingModal = document.querySelector('.game-over-modal');
    if(existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    
    const messageBox = document.createElement('div');
    messageBox.className = 'modal-content';
    
    if(isWin) {
        messageBox.innerHTML = `
            <h2>🏆 YOU WIN! 🏆</h2>
            <p>Final Score: ${currentScore} / ${TARGET_SCORE}</p>
            <button onclick="location.reload()">Play Again</button>
        `;
    } else {
        messageBox.innerHTML = `
            <h2>💀 GAME OVER 💀</h2>
            <p>No moves left!</p>
            <p>Final Score: ${currentScore}</p>
            <button onclick="location.reload()">Play Again</button>
        `;
    }
    
    modal.appendChild(messageBox);
    document.body.appendChild(modal);
}

// Cascade system with multiplier
async function processCascade() {
    let totalPoints = 0;
    let cascadeLevel = 1;
    let hasMatches = true;
    
    while(hasMatches) {
        const matches = checkMatches();
        
        if(matches.length > 0) {
            // Calculate points with multiplier
            let multiplier = 1;
            if(cascadeLevel === 1) multiplier = 1;
            else if(cascadeLevel === 2) multiplier = 1.5;
            else if(cascadeLevel === 3) multiplier = 2;
            else multiplier = 2.5;
            
            const basePoints = matches.length * 10;
            const points = Math.floor(basePoints * multiplier);
            
            currentScore += points;
            totalPoints += points;
            document.getElementById('score').textContent = currentScore;
            
            // Show cascade message
            updateStatusMessage(`Chain x${cascadeLevel}! ${multiplier}x Multiplier! +${points} points!`);
            
            // Add animation to matched tiles
            const tileElements = document.querySelectorAll('#game-grid .tile');
            for(let match of matches) {
                const index = match.row * COLS + match.col;
                if(tileElements[index]) {
                    tileElements[index].classList.add('match-animation');
                    setTimeout(() => {
                        if(tileElements[index]) tileElements[index].classList.remove('match-animation');
                    }, 200);
                }
            }
            
            // Clear matches
            for(let match of matches) {
                grid[match.row][match.col] = -1;
            }
            
            // Apply gravity
            applyGravity();
            renderGrid();
            
            // Wait for visual effect
            await new Promise(resolve => setTimeout(resolve, 250));
            
            cascadeLevel++;
            
            // Check win condition
            if(checkWin()) return totalPoints;
        } else {
            hasMatches = false;
        }
    }
    
    // Check for no moves after cascade
    if(!hasValidMoves() && currentScore < TARGET_SCORE) {
        gameActive = false;
        showGameOverMessage(false);
    }
    
    return totalPoints;
}

// Handle tile click
async function onTileClick(row, col) {
    if(!gameActive || isProcessing) return;
    
    if(selectedRow === -1 && selectedCol === -1) {
        // Select first tile
        selectedRow = row;
        selectedCol = col;
        renderGrid();
        updateStatusMessage(`👉 Selected ${TILE_TYPES[grid[row][col]]}`);
    } else {
        const isAdjacent = (Math.abs(selectedRow - row) + Math.abs(selectedCol - col)) === 1;
        
        if(isAdjacent) {
            isProcessing = true;
            
            // Swap tiles
            const temp = grid[selectedRow][selectedCol];
            grid[selectedRow][selectedCol] = grid[row][col];
            grid[row][col] = temp;
            
            renderGrid();
            
            // Check for matches
            const matches = checkMatches();
            if(matches.length > 0) {
                await processCascade();
                renderGrid();
            } else {
                // Swap back if no match
                const tempBack = grid[selectedRow][selectedCol];
                grid[selectedRow][selectedCol] = grid[row][col];
                grid[row][col] = tempBack;
                
                updateStatusMessage('❌ No match! Try again.', true);
                renderGrid();
            }
            
            selectedRow = -1;
            selectedCol = -1;
            isProcessing = false;
            renderGrid();
        } else {
            // Select new tile
            selectedRow = row;
            selectedCol = col;
            renderGrid();
            updateStatusMessage(`👉 Selected ${TILE_TYPES[grid[row][col]]}`);
        }
    }
}

// Reset game function
function resetGame() {
    if(isProcessing) return;
    gameActive = true;
    selectedRow = -1;
    selectedCol = -1;
    isProcessing = false;
    currentScore = 0;
    document.getElementById('score').textContent = currentScore;
    initGrid();
    renderGrid();
    updateStatusMessage('✨ Game reset! Good luck! ✨');
}

// Return to menu function
function returnToMenu() {
    if(isProcessing) return;
    gameActive = false;
    const startMenu = document.getElementById('startMenu');
    if(startMenu) startMenu.classList.remove('hidden');
    resetGame();
}

// Start the game from menu
function startGame() {
    const startMenu = document.getElementById('startMenu');
    if(startMenu) startMenu.classList.add('hidden');
    gameActive = true;
    selectedRow = -1;
    selectedCol = -1;
    isProcessing = false;
    currentScore = 0;
    document.getElementById('score').textContent = currentScore;
    initGrid();
    renderGrid();
    updateStatusMessage('✨ Game started! Swap tiles to match 3+! ✨');
}

// Initialize event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize grid but don't start game yet
    initGrid();
    renderGrid();
    
    // Add reset button listener
    const resetButton = document.getElementById('resetButton');
    if(resetButton) {
        resetButton.addEventListener('click', resetGame);
    }
    
    // Add menu button listener
    const menuButton = document.getElementById('menuButton');
    if(menuButton) {
        menuButton.addEventListener('click', returnToMenu);
    }
    
    // Add start button listener
    const startButton = document.getElementById('startButton');
    if(startButton) {
        startButton.addEventListener('click', startGame);
    }
    
    // Enter key to start
    document.addEventListener('keydown', function(e) {
        if(e.key === 'Enter') {
            const startMenu = document.getElementById('startMenu');
            if(startMenu && !startMenu.classList.contains('hidden')) {
                startGame();
            }
        }
    });
    
    // Game is not active until menu is closed
    gameActive = false;
    updateStatusMessage('🌟 Press ENTER to start! 🌟');
});