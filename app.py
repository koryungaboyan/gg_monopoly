from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from game_logic import QUESTIONS
import random

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# Example players dict — you can manage players dynamically if needed
players = {
    "player1": 0,
    "player2": 0
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/questions", methods=["GET"])
def get_all_questions():
    """Returns all questions with answers randomly shuffled."""
    payload = []
    for pos, q in QUESTIONS.items():
        options = q["options"][:]  # copy the list
        correct_answer = options[q["answer_index"]]

        # Shuffle options
        random.shuffle(options)

        # Find the new index of the correct answer after shuffling
        new_answer_index = options.index(correct_answer)

        payload.append({
            "position": pos,
            "text": q["text"],
            "options": options,
            "answer_index": new_answer_index,
        })
    return jsonify(payload)

@app.route("/api/answer/<player_id>", methods=["POST"])
def check_answer(player_id):
    """Ստուգում է պատասխանը տվյալ խաղացողի համար"""
    if player_id not in players:
        return jsonify({"ok": False, "error": "Չի գտնվել այդ խաղացողը։"})

    data = request.get_json()
    user_answer = data.get("answer", "").strip().lower()
    position = players[player_id]
    current_q = QUESTIONS.get(position)

    if not current_q:
        return jsonify({"ok": False, "error": "Այդ քառակուսու համար հարց չկա։"})

    correct_answer = current_q["options"][current_q["answer_index"]].strip().lower()

    if user_answer == correct_answer:
        players[player_id] += 1  # առաջ գնա
        message = f"{player_id} ճիշտ պատասխանեց ✅ և առաջ անցավ {players[player_id]} դիրքին։"
        correct = True
    else:
        players[player_id] = 0  # սխալ դեպքում՝ GO
        message = f"{player_id} սխալ պատասխանեց ❌ և վերադարձավ GO վանդակ։"
        correct = False

    return jsonify({
        "ok": True,
        "player": player_id,
        "correct": correct,
        "position": players[player_id],
        "message": message
    })

@app.route("/api/reset", methods=["POST"])
def reset_game():
    """Վերադարձնում է երկու խաղացողին սկիզբ"""
    for player in players:
        players[player] = 0
    return jsonify({"ok": True, "message": "Խաղը սկսվեց նորից 🚀", "players": players})

if __name__ == "__main__":
    app.run(debug=True)
