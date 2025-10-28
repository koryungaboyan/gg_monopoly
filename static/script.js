// === Monopoly Q&A Game (white text + no move on wrong answer + proper board path) ===

const rollBtn = document.getElementById("roll-btn");
const diceResult = document.getElementById("dice-result");
const playerTurn = document.getElementById("player-turn");
const logDiv = document.getElementById("log");

const tokens = [
  document.getElementById("token-0"),
  document.getElementById("token-1"),
];

const modal = document.getElementById("question-modal");
const qText = document.getElementById("q-text");
const qOptions = document.getElementById("q-options");
const closeQ = document.getElementById("close-q");

let currentPlayer = 0;
let positions = [0, 0];
let previousPositions = [0, 0];
let questions = [];
let answerSelected = false;
let gameOver = false;

let pathPositions = [];

// === 1. Generate board path starting from bottom-left corner ===
function generatePath() {
  const boardSize = 700;
  const cornerSize = 100;
  const sideSquareWidth = (boardSize - 2 * cornerSize) / 9;
  const squareHeight = 100;
  
  pathPositions = [];
  
  // Start at bottom-left corner (position 0)
  pathPositions.push({ x: cornerSize/2, y: boardSize - cornerSize/2 });
  
  // Left column (bottom to top): positions 1-9
  for (let i = 1; i <= 9; i++) {
    pathPositions.push({ 
      x: squareHeight/2, 
      y: boardSize - cornerSize - (i * sideSquareWidth) + sideSquareWidth/2 
    });
  }
  
  // Top-left corner (position 10)
  pathPositions.push({ x: cornerSize/2, y: cornerSize/2 });
  
  // Top row (left to right): positions 11-19
  for (let i = 1; i <= 9; i++) {
    pathPositions.push({ 
      x: cornerSize + (i * sideSquareWidth) - sideSquareWidth/2, 
      y: squareHeight/2 
    });
  }
  
  // Top-right corner (position 20)
  pathPositions.push({ x: boardSize - cornerSize/2, y: cornerSize/2 });
  
  // Right column (top to bottom): positions 21-29
  for (let i = 1; i <= 9; i++) {
    pathPositions.push({ 
      x: boardSize - squareHeight/2, 
      y: cornerSize + (i * sideSquareWidth) - sideSquareWidth/2 
    });
  }
  
  // Bottom-right corner (position 30)
  pathPositions.push({ x: boardSize - cornerSize/2, y: boardSize - cornerSize/2 });
  
  // Bottom row (right to left): positions 31-39
  for (let i = 1; i <= 9; i++) {
    pathPositions.push({ 
      x: boardSize - cornerSize - (i * sideSquareWidth) + sideSquareWidth/2, 
      y: boardSize - squareHeight/2 
    });
  }
  
  console.log("Path positions generated:", pathPositions.length);
}

// === 2. Load questions ===
async function loadQuestions() {
  try {
    const res = await fetch("/api/questions", { cache: "no-store" });
    if (!res.ok) throw new Error(`Cannot load questions: ${res.status}`);
    questions = await res.json();
    console.log(`Loaded ${questions.length} questions`);
  } catch (err) {
    console.error("Error loading questions:", err);
    alert("Հարցերը չբեռնվեցին։");
  }
}

// === 3. Roll dice ===
rollBtn.addEventListener("click", () => {
  if (gameOver) return;
  
  const roll = Math.floor(Math.random() * 6) + 1;
  diceResult.textContent = roll;

  previousPositions[currentPlayer] = positions[currentPlayer];
  const newPosition = (positions[currentPlayer] + roll) % pathPositions.length;

  logDiv.innerHTML += `<div style="color:white;">🎲 Խաղացող ${
    currentPlayer + 1
  }-ը նետեց ${roll}</div>`;

  // Check if player will complete the loop (win condition)
  const willWin = positions[currentPlayer] + roll >= pathPositions.length;

  showQuestion(roll, newPosition, willWin);
});

// === 4. Move token visually ===
function moveToken(token, pos) {
  if (!pathPositions.length) return;
  const p = pathPositions[pos % pathPositions.length];
  token.style.transform = `translate(${p.x - 15}px, ${p.y - 15}px)`;
  token.style.left = '0px';
  token.style.top = '0px';
}

// === 5. Show multiple-choice question ===
function showQuestion(roll, newPosition, willWin) {
  if (!questions.length) return alert("Հարցերը դեռ չեն բեռնվել։");

  answerSelected = false;

  // Pick one question (you can also map by board position if you want)
  const q = questions[Math.floor(Math.random() * questions.length)];
  // q has: { text, options: [...], answer_index: number }

  qText.textContent = q.text;
  qOptions.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("div");
    btn.classList.add("q-option");
    btn.textContent = opt;

    btn.addEventListener("click", () => {
      if (answerSelected) return;
      answerSelected = true;

      // Disable all buttons
      document.querySelectorAll(".q-option").forEach(b => {
        b.style.pointerEvents = "none";
      });

      const isCorrect = idx === q.answer_index;

      if (isCorrect) {
        btn.style.background = "#28a745";
        btn.style.color = "white";
        logDiv.innerHTML += `<div style="color:#8effa2;">✅ Ճիշտ պատասխան՝ ${opt}</div>`;

        // Move player forward
        positions[currentPlayer] = newPosition;
        const token = tokens[currentPlayer];
        moveToken(token, positions[currentPlayer]);

        if (willWin) {
          setTimeout(() => showWinModal(currentPlayer + 1), 1000);
        } else {
          setTimeout(() => {
            modal.classList.add("hidden");
            currentPlayer = (currentPlayer + 1) % tokens.length;
            playerTurn.textContent = `Խաղացող ${currentPlayer + 1}`;
          }, 900);
        }
      } else {
        btn.style.background = "#dc3545";
        btn.style.color = "white";
        const correctText = q.options[q.answer_index];
        logDiv.innerHTML += `<div style="color:#ff7b7b;">❌ Սխալ պատասխան։ Ճիշտը՝ ${correctText}. Վերադարձ սկիզբ!</div>`;

        // Reset player to start
        positions[currentPlayer] = 0;
        const token = tokens[currentPlayer];
        moveToken(token, 0);

        setTimeout(() => {
          modal.classList.add("hidden");
          currentPlayer = (currentPlayer + 1) % tokens.length;
          playerTurn.textContent = `Խաղացող ${currentPlayer + 1}`;
        }, 1200);
      }
    });

    qOptions.appendChild(btn);
  });

  modal.classList.remove("hidden");
}

// === 6. Fireworks animation ===
function createFirework(x, y) {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493', '#00ff7f'];
  const particles = 40;
  
  for (let i = 0; i < particles; i++) {
    const particle = document.createElement('div');
    particle.className = 'firework firework-particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    const color = colors[Math.floor(Math.random() * colors.length)];
    particle.style.background = color;
    particle.style.color = color;
    
    const angle = (Math.PI * 2 * i) / particles;
    const velocity = 150 + Math.random() * 100;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    particle.style.setProperty('--x', vx + 'px');
    particle.style.setProperty('--y', vy + 'px');
    
    document.body.appendChild(particle);
    
    setTimeout(() => particle.remove(), 1500);
  }
}

function startFireworks() {
  const interval = setInterval(() => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight * 0.6;
    createFirework(x, y);
  }, 200);
  
  setTimeout(() => clearInterval(interval), 6000);
}

// === 7. Show win modal ===
function showWinModal(playerNumber) {
  gameOver = true;
  modal.classList.add("hidden");
  
  // Start fireworks
  startFireworks();
  
  const winModal = document.createElement("div");
  winModal.className = "modal";
  winModal.style.zIndex = "10000";
  winModal.innerHTML = `
    <div class="modal-content win-modal">
      <h2 style="color: #ffd700; font-size: 36px; margin-bottom: 20px; animation: pulse 1s infinite;">🎉 Հաղթող! 🎉</h2>
      <p style="font-size: 24px; margin-bottom: 30px; color: white;">Խաղացող ${playerNumber} հաղթեց խաղը!</p>
      <button onclick="location.reload()" style="padding: 12px 30px; font-size: 18px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.2s;">
        Նոր խաղ
      </button>
    </div>
  `;
  document.body.appendChild(winModal);
}

// === 8. Close modal - DISABLED ===
closeQ.addEventListener("click", () => {
  return;
});

// === 9. Initialize ===
window.addEventListener("load", () => {
  generatePath();
  loadQuestions();
  playerTurn.textContent = `Խաղացող ${currentPlayer + 1}`;
  
  tokens.forEach((token, i) => {
    moveToken(token, 0);
  });
});