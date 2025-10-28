// Simple playable prototype
// Assumptions:
// - Board has 20 squares (0..19). 0 = GO start.
// - Squares positions are approximated around the edges; adjust percentages if needed.
// - When player lands on a square that has a question, we fetch from backend /api/get_question/<idx>

// CONFIG
const NUM_SQUARES = 20;
const QUESTION_SQUARES = [1,2,3,4,5,6,7,8]; // Դիմացվող ինդեքսներ որոնք հարցեր ունեն (պահեստում game_logic.py)
// Players
const players = [
  { name: "Խաղացող 1", pos: 0 },
  { name: "Խաղացող 2", pos: 0 },
];
let currentPlayer = 0;

// approximate positions (percentages) for 20 squares (clockwise)
const squarePositions = [
  {left:"2%", top:"88%"}, //0 GO
  {left:"12%", top:"88%"},
  {left:"22%", top:"88%"},
  {left:"32%", top:"88%"},
  {left:"42%", top:"88%"},
  {left:"52%", top:"88%"},
  {left:"62%", top:"88%"},
  {left:"72%", top:"88%"},
  {left:"82%", top:"88%"},
  {left:"82%", top:"72%"},
  {left:"82%", top:"62%"},
  {left:"82%", top:"52%"},
  {left:"82%", top:"42%"},
  {left:"82%", top:"32%"},
  {left:"72%", top:"32%"},
  {left:"62%", top:"32%"},
  {left:"52%", top:"32%"},
  {left:"42%", top:"32%"},
  {left:"32%", top:"32%"},
  {left:"22%", top:"32%"},
];

function init() {
  // create invisible squares (for positioning)
  const sc = document.getElementById("squares-container");
  for (let i=0; i<NUM_SQUARES; i++){
    const sq = document.createElement("div");
    sq.className = "square";
    sq.dataset.idx = i;
    const pos = squarePositions[i] || {left:"2%", top:"2%"};
    sq.style.left = pos.left;
    sq.style.top = pos.top;
    sq.style.width = "8%";
    sq.style.height = "8%";
    sc.appendChild(sq);
  }

  // position tokens initially
  updateTokens();

  // setup roll button
  document.getElementById("roll-btn").addEventListener("click", rollDice);

  // close question
  document.getElementById("close-q").addEventListener("click", () => {
    document.getElementById("question-modal").classList.add("hidden");
  });

  log("Խաղը սկսվեց։ Սկսում ենք GO դաշտից։");
}

function rollDice(){
  const result = Math.floor(Math.random()*6) + 1;
  document.getElementById("dice-result").innerText = result;
  log(`${players[currentPlayer].name} թափեց ${result}`);
  movePlayer(result);
}

function movePlayer(steps){
  players[currentPlayer].pos = (players[currentPlayer].pos + steps) % NUM_SQUARES;
  updateTokens();
  const pos = players[currentPlayer].pos;
  log(`${players[currentPlayer].name} տեղափոխվեց՝ ${pos}`);

  if (QUESTION_SQUARES.includes(pos)) {
    // վերցրեցինք հարցը backend-ից
    fetch(`/api/get_question/${pos}`)
      .then(r => r.json())
      .then(data => {
        if (!data.ok) {
          log("Այս դաշտում հարց չկա։");
          nextTurn();
          return;
        }
        showQuestionModal(pos, data.question);
      })
      .catch(err => {
        console.error(err);
        log("Սխալ հարցը բերելուց։");
        nextTurn();
      });
  } else {
    // ոչ հարցային դաշտ
    nextTurn();
  }
}

function showQuestionModal(pos, q){
  const modal = document.getElementById("question-modal");
  document.getElementById("q-text").innerText = q.text;
  const opts = document.getElementById("q-options");
  opts.innerHTML = "";
  q.options.forEach((opt, i) => {
    const d = document.createElement("div");
    d.className = "q-option";
    d.innerText = opt;
    d.addEventListener("click", () => {
      handleAnswer(pos, i, q.answer_index);
    });
    opts.appendChild(d);
  });
  modal.classList.remove("hidden");
}

function handleAnswer(pos, chosenIndex, correctIndex){
  const modal = document.getElementById("question-modal");
  modal.classList.add("hidden");
  if (chosenIndex === correctIndex) {
    log(`${players[currentPlayer].name} ճիշտ պատասխանեց՝ +1 քայլ առաջ!`);
    // reward: ավտոմատ մեկ քայլ առաջ (ստացվի ընդհանրապես կարող ենք աճեցնել)
    players[currentPlayer].pos = (players[currentPlayer].pos + 1) % NUM_SQUARES;
    updateTokens();
    // player stays — next player's turn
    nextTurn();
  } else {
    log(`${players[currentPlayer].name} սխալ պատասխանեց — տեղափոխվում է սկիզբ (GO)։`);
    players[currentPlayer].pos = 0;
    updateTokens();
    nextTurn();
  }
}

function updateTokens(){
  players.forEach((p, idx) => {
    const t = document.getElementById(`token-${idx}`);
    const square = document.querySelector(`.square[data-idx="${p.pos}"]`);
    if (square) {
      // place token near square
      t.style.left = square.style.left;
      t.style.top = square.style.top;
      // offset slightly so tokens don't completely overlap
      t.style.transform = `translate(${idx*18}px, -10px)`;
    }
  });

  document.getElementById("player-turn").innerText = players[currentPlayer].name;
}

function nextTurn(){
  currentPlayer = (currentPlayer + 1) % players.length;
  document.getElementById("player-turn").innerText = players[currentPlayer].name;
}

function log(msg){
  const el = document.getElementById("log");
  const time = new Date().toLocaleTimeString();
  el.innerHTML = `<div>[${time}] ${msg}</div>` + el.innerHTML;
}

// init on load
window.addEventListener("load", init);
