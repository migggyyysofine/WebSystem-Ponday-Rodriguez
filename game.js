// Game configuration
const ROWS = 8;
const COLS = 8;
const TARGET_SCORE = 1200;
const TILE_TYPES = ['⭐', '🍀', '❤️', '💎', '🪄', '🔥'];

let grid = [];
let currentScore = 0;
let gameActive = true;

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

let selectedRow = -1;
let selectedCol = -1;

// Render the grid to HTML with click events
function renderGrid() {
    const gridContainer = document.getElementById('game-grid');
    gridContainer.innerHTML = '';
    
    for(let i = 0; i < ROWS; i++) {
        for(let j = 0; j < COLS; j++) {
            const tile = document.createElement('div');
            tile.textContent = TILE_TYPES[grid[i][j]];
            tile.style.width = '50px';
            tile.style.height = '50px';
            tile.style.display = 'flex';
            tile.style.alignItems = 'center';
            tile.style.justifyContent = 'center';
            tile.style.backgroundColor = '#f0a3ff';
            tile.style.borderRadius = '10px';
            tile.style.cursor = 'pointer';
            tile.style.fontSize = '30px';
            tile.style.transition = 'transform 0.1s';
            
            // Highlight selected tile
            if(selectedRow === i && selectedCol === j) {
                tile.style.border = '3px solid gold';
                tile.style.transform = 'scale(0.95)';
            }
            
            tile.addEventListener('click', () => onTileClick(i, j));
            gridContainer.appendChild(tile);
        }
    }
}

// Handle tile click
async function onTileClick(row, col) {
    if(!gameActive) return;
    
    if(selectedRow === -1 && selectedCol === -1) {
        selectedRow = row;
        selectedCol = col;
        renderGrid();
    } else {
        const isAdjacent = (Math.abs(selectedRow - row) + Math.abs(selectedCol - col)) === 1;
        
        if(isAdjacent) {
            // Swap tiles
            const temp = grid[selectedRow][selectedCol];
            grid[selectedRow][selectedCol] = grid[row][col];
            grid[row][col] = temp;
            
            renderGrid();
            
            // Check for matches
            const matches = checkMatches();
            if(matches.length > 0) {
                const points = removeMatches(matches);
                document.getElementById('score').textContent = currentScore;
                // Show popup message
                alert(`Match found! +${points} points!`);
                renderGrid();
            } else {
                // Swap back if no match
                const tempBack = grid[selectedRow][selectedCol];
                grid[selectedRow][selectedCol] = grid[row][col];
                grid[row][col] = tempBack;
                alert('No match! Try again.');
            }
            
            selectedRow = -1;
            selectedCol = -1;
            renderGrid();
        } else {
            selectedRow = row;
            selectedCol = col;
            renderGrid();
        }
    }
}

// Start the game
function startGame() {
    initGrid();
    renderGrid();
    document.getElementById('score').textContent = currentScore;
    document.getElementById('target').textContent = TARGET_SCORE;
}

startGame();
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

// Test match detection (temporary)
function testMatchDetection() {
    const matches = checkMatches();
    console.log(`Found ${matches.length} matching tiles`);
    return matches;
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

// Test match detection (temporary)
function testMatchDetection() {
    const matches = checkMatches();
    console.log(`Found ${matches.length} matching tiles`);
    return matches;
}
// Remove matched tiles and add score
function removeMatches(matches) {
    if(matches.length === 0) return 0;
    
    const pointsEarned = matches.length * 10;
    currentScore += pointsEarned;
    document.getElementById('score').textContent = currentScore;
    
    // Clear matched tiles
    for(let match of matches) {
        grid[match.row][match.col] = -1; // Mark as empty
    }
    
    return pointsEarned;
}

// Update the swap function to check for matches
// Replace the existing swap logic in onTileClick with this:
// Inside the isAdjacent block, replace the swap code with:

// (Show code modification - I'll provide the complete modified function)
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

// Modify the removeMatches function to call applyGravity
// Add this updated version:
// Inside onTileClick, replace the match check block:
if(matches.length > 0) {
    await processCascade();
    renderGrid();
} else {
    // Swap back if no match
    const tempBack = grid[selectedRow][selectedCol];
    grid[selectedRow][selectedCol] = grid[row][col];
    grid[row][col] = tempBack;
    alert('No match! Try again.');
    renderGrid();
}
    
    // Apply gravity to make tiles fall
    applyGravity();
    
    return pointsEarned;
}
// Updated cascade system with multiplier
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
            
            // Show cascade message with multiplier
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = `Chain x${cascadeLevel}! ${multiplier}x Multiplier! +${points} points!`;
            statusDiv.style.backgroundColor = cascadeLevel >= 3 ? '#ff9800' : '#2196f3';
            
            // Add animation to matched tiles
            for(let match of matches) {
                const tileElements = document.querySelectorAll('#game-grid div');
                const index = match.row * COLS + match.col;
                if(tileElements[index]) {
                    tileElements[index].classList.add('match-animation');
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

// Helper to create status div if it doesn't exist
function createStatusDiv() {
    let statusDiv = document.getElementById('status');
    if(!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'status';
        statusDiv.style.marginTop = '20px';
        statusDiv.style.padding = '10px';
        statusDiv.style.backgroundColor = '#333';
        statusDiv.style.color = 'white';
        statusDiv.style.borderRadius = '10px';
        document.querySelector('.game-container').appendChild(statusDiv);
    }
    return statusDiv;
}
// Check if player has won
function checkWin() {
    if(currentScore >= TARGET_SCORE) {
        gameActive = false;
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = '🎉 VICTORY! You reached the target score! 🎉';
        statusDiv.style.backgroundColor = '#4caf50';
        showGameOverMessage(true);
        return true;
    }
    return false;
}

// Check if any valid moves remain
function hasValidMoves() {
    // Try every possible swap to see if any match can be made
    for(let row = 0; row < ROWS; row++) {
        for(let col = 0; col < COLS; col++) {
            // Try swapping right
            if(col + 1 < COLS) {
                swapAndTest(row, col, row, col + 1);
                let matches = checkMatches();
                swapAndTest(row, col, row, col + 1); // Swap back
                if(matches.length > 0) return true;
            }
            
            // Try swapping down
            if(row + 1 < ROWS) {
                swapAndTest(row, col, row + 1, col);
                let matches = checkMatches();
                swapAndTest(row, col, row + 1, col); // Swap back
                if(matches.length > 0) return true;
            }
        }
    }
    return false;
}

// Helper function to swap and test
function swapAndTest(row1, col1, row2, col2) {
    const temp = grid[row1][col1];
    grid[row1][col1] = grid[row2][col2];
    grid[row2][col2] = temp;
}

// Show game over message
function showGameOverMessage(isWin) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    
    const messageBox = document.createElement('div');
    messageBox.style.backgroundColor = 'white';
    messageBox.style.padding = '40px';
    messageBox.style.borderRadius = '20px';
    messageBox.style.textAlign = 'center';
    
    if(isWin) {
        messageBox.innerHTML = `<h1>🏆 YOU WIN! 🏆</h1><p>Final Score: ${currentScore}</p><button onclick="location.reload()">Play Again</button>`;
    } else {
        messageBox.innerHTML = `<h1>💀 GAME OVER 💀</h1><p>No moves left!<br>Final Score: ${currentScore}</p><button onclick="location.reload()">Play Again</button>`;
    }
    
    modal.appendChild(messageBox);
    document.body.appendChild(modal);
}

// Add check after each cascade in processCascade
// Add this line inside the while loop after updating score:
// if(checkWin()) return totalPoints;
// Add to game.js
function returnToMenu() {
    gameActive = false;
    document.getElementById('startMenu').style.display = 'flex';
    // Reset game state
    initGrid();
    currentScore = 0;
    selectedRow = -1;
    selectedCol = -1;
    document.getElementById('score').textContent = currentScore;
    renderGrid();
}

// Add event listener
document.getElementById('menuButton').addEventListener('click', returnToMenu);