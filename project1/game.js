// ======== GAME CONFIG =========
const DIFFICULTIES = {
  Easy: { cols: 20, rows: 20, cell: 20 },
  Medium: { cols: 40, rows: 40, cell: 20 },
  Hard: { cols: 80, rows: 80, cell: 15 },
  Extreme: { cols: 120, rows: 120, cell: 10 },
};

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1, name: "UP" },
  ArrowDown: { x: 0, y: 1, name: "DOWN" },
  ArrowLeft: { x: -1, y: 0, name: "LEFT" },
  ArrowRight: { x: 1, y: 0, name: "RIGHT" },
  w: { x: 0, y: -1, name: "UP" },
  s: { x: 0, y: 1, name: "DOWN" },
  a: { x: -1, y: 0, name: "LEFT" },
  d: { x: 1, y: 0, name: "RIGHT" },
};

// ======== GLOBAL VARIABLES =========
let gameState = "stopped";
let difficulty = "Easy";
let intervalMs = 120;
let cols, rows, cell;
let snake = [];
let dir = { x: 1, y: 0, name: "RIGHT" };
let nextDir = null;
let head = { x: 0, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let tickInterval = null;
let canvas, ctx, debugPanel;

// ======== DETECT DEVICE =========
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ======== INITIALIZATION =========
function randomFood() {
  return {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows),
  };
}

function initGame(diff = difficulty) {
  ({ cols, rows, cell } = DIFFICULTIES[diff]);
  const centerX = Math.floor(cols / 2);
  const centerY = Math.floor(rows / 2);

  snake = [];
  for (let i = 0; i < 4; i++) snake.push({ x: centerX - i, y: centerY });

  dir = { x: 1, y: 0, name: "RIGHT" };
  head = { ...snake[0] };
  nextDir = null;
  food = randomFood();
  score = 0;
  gameState = "stopped";
  draw();
  updateDebug("Game initialized.");
}

// ======== GAME CONTROL =========
function startGame() {
  if (gameState === "running") return;
  gameState = "running";
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(step, intervalMs);
  drawLoop();
  updateDebug("Game started.");
}

function pauseGame() {
  gameState = "paused";
  clearInterval(tickInterval);
  tickInterval = null;
  updateDebug("Paused.");
}

function resetGame() {
  clearInterval(tickInterval);
  initGame(difficulty);
}

// ======== GAME LOGIC =========
function step() {
  if (nextDir) {
    dir = nextDir;
    nextDir = null;
  }

  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  // Wall collision
  if (newHead.x < 0 || newHead.y < 0 || newHead.x >= cols || newHead.y >= rows) {
    gameOver("💥 You hit the wall!");
    return;
  }

  // Self collision
  for (let s of snake) {
    if (s.x === newHead.x && s.y === newHead.y) {
      gameOver("💀 You bit yourself!");
      return;
    }
  }

  snake.unshift(newHead);
  head = newHead;

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
    food = randomFood();
  } else {
    snake.pop();
  }
}

function gameOver(msg) {
  gameState = "gameover";
  clearInterval(tickInterval);
  updateDebug(`Game Over — ${msg}`);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff3333";
  ctx.font = "bold 30px Orbitron";
  ctx.fillText("GAME OVER!", 40, 60);
  ctx.font = "16px Share Tech Mono";
  ctx.fillText(msg, 45, 85);
}

// ======== DRAWING =========
function draw() {
  const width = cols * cell;
  const height = rows * cell;

  // Responsive scale
  const container = canvas.parentElement;
  const scale = Math.min(container.clientWidth / width, container.clientHeight / height);
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  ctx.fillStyle = "#050A10";
  ctx.fillRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cell, 0);
    ctx.lineTo(x * cell, height);
    ctx.stroke();
  }
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cell);
    ctx.lineTo(width, y * cell);
    ctx.stroke();
  }

  // Food
  ctx.shadowColor = "#ff0077";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#ff0077";
  ctx.beginPath();
  ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Snake
  ctx.shadowColor = "#00ff99";
  ctx.shadowBlur = 12;
  for (let i = 0; i < snake.length; i++) {
    const s = snake[i];
    ctx.fillStyle = i === 0 ? "#00FFAA" : "#00DD77";
    ctx.fillRect(s.x * cell, s.y * cell, cell - 1, cell - 1);
  }
  ctx.shadowBlur = 0;

  // Overlay info
  ctx.fillStyle = "#0f0";
  ctx.font = "12px Share Tech Mono";
  ctx.fillText(`Mode: ${isMobileDevice() ? "TOUCH" : "KEYBOARD"}`, 8, 16);
  ctx.fillText(`Dir: ${dir.name}`, 8, 30);
  ctx.fillText(`Score: ${score}`, 8, 44);
  ctx.fillText(`Head: ${head.x},${head.y}`, 8, 58);
}

function drawLoop() {
  if (gameState === "running") {
    draw();
    requestAnimationFrame(drawLoop);
  }
}

// ======== DEBUG =========
function updateDebug(msg) {
  debugPanel.textContent = `${msg} | Score: ${score}`;
}

// ======== INPUTS =========
// Mouse for direction
function handleMouseClick(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const headPixelX = head.x * cell + cell / 2;
  const headPixelY = head.y * cell + cell / 2;
  const dx = clickX - headPixelX;
  const dy = clickY - headPixelY;

  if (Math.abs(dx) > Math.abs(dy)) {
    nextDir = dx > 0 ? { x: 1, y: 0, name: "RIGHT" } : { x: -1, y: 0, name: "LEFT" };
  } else {
    nextDir = dy > 0 ? { x: 0, y: 1, name: "DOWN" } : { x: 0, y: -1, name: "UP" };
  }
}

// ======== SETUP =========
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  debugPanel = document.getElementById("debugPanel");

  // Difficulty buttons
  document.querySelectorAll(".difficulties button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".difficulties button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      difficulty = btn.dataset.diff;
      resetGame();
    });
  });

  // Control buttons
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("pauseBtn").addEventListener("click", pauseGame);
  document.getElementById("resetBtn").addEventListener("click", resetGame);
  document.getElementById("speedInput").addEventListener("input", (e) => {
    intervalMs = Number(e.target.value);
  });

  // Mouse
  canvas.addEventListener("click", handleMouseClick);

  // Keyboard controls (desktop)
  if (!isMobileDevice()) {
    window.addEventListener("keydown", (e) => {
      const newDir = DIRECTIONS[e.key];
      if (!newDir) return;
      if (dir.x + newDir.x === 0 && dir.y + newDir.y === 0) return;
      nextDir = newDir;
    });
  }

  // Mobile touch controls
  if (isMobileDevice()) {
    const mobileDirs = {
      upBtn: { x: 0, y: -1, name: "UP" },
      downBtn: { x: 0, y: 1, name: "DOWN" },
      leftBtn: { x: -1, y: 0, name: "LEFT" },
      rightBtn: { x: 1, y: 0, name: "RIGHT" },
    };

    Object.entries(mobileDirs).forEach(([id, dirObj]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          if (dir.x + dirObj.x === 0 && dir.y + dirObj.y === 0) return;
          nextDir = dirObj;
        });
      }
    });
  }

  initGame(difficulty);
});
