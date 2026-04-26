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