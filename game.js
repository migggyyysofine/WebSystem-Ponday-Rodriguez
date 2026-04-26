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

// Render the grid to HTML
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
            gridContainer.appendChild(tile);
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