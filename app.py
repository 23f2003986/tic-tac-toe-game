import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import json
import random

# --- Application Setup ---
app = Flask(__name__)
app.secret_key = os.urandom(24)

# --- Game Logic ---
WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  # Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  # Columns
    [0, 4, 8], [2, 4, 6]            # Diagonals
]

def check_winner(board, player):
    """Checks if a player has won the game."""
    for combo in WINNING_COMBINATIONS:
        if all(board[i] == player for i in combo):
            return True
    return False

def check_draw(board):
    """Checks if the game is a draw."""
    return all(cell != '' for cell in board)

def get_best_move(board):
    """
    Implements a simple (minimax) rule-based AI for the computer.
    """
    # 1. Check for a winning move for the AI
    for i in range(9):
        if board[i] == '':
            temp_board = list(board)
            temp_board[i] = 'O'
            if check_winner(temp_board, 'O'):
                return i

    # 2. Check for a blocking move against the player
    for i in range(9):
        if board[i] == '':
            temp_board = list(board)
            temp_board[i] = 'X'
            if check_winner(temp_board, 'X'):
                return i

    # 3. Take the center if available
    if board[4] == '':
        return 4

    # 4. Take a corner if available
    corners = [0, 2, 6, 8]
    available_corners = [c for c in corners if board[c] == '']
    if available_corners:
        return random.choice(available_corners)

    # 5. Take any remaining edge
    sides = [1, 3, 5, 7]
    available_sides = [s for s in sides if board[s] == '']
    if available_sides:
        return random.choice(available_sides)

    return -1

# --- Flask Routes ---

@app.route('/')
def index():
    """Renders the game template and initializes scores."""
    if 'scores' not in session:
        session['scores'] = {'player': 0, 'ai': 0, 'draws': 0}
    
    return render_template('game.html')

@app.route('/api/move', methods=['POST'])
def api_move():
    """Handles a player's move, makes the AI's move and returns the updated game state."""
    data = request.get_json()
    player_move_index = data.get('cell')
    
    board = session.get('board', [''] * 9)
    game_over = session.get('game_over', False)

    if game_over or board[player_move_index] != '':
        return jsonify({
            'board': board,
            'status': session.get('status'),
            'gameOver': game_over
        })

    # Player 'X' makes their move
    board[player_move_index] = 'X'
    
    if check_winner(board, 'X'):
        session['scores']['player'] += 1
        session['status'] = 'Player X wins! Please Reset Game.'
        game_over = True
    elif check_draw(board):
        session['scores']['draws'] += 1
        session['status'] = 'Game is a draw! Please Reset Game.'
        game_over = True
    else:
        ai_move_index = get_best_move(board)
        if ai_move_index != -1:
            board[ai_move_index] = 'O'
            
            if check_winner(board, 'O'):
                session['scores']['ai'] += 1
                session['status'] = 'Player O (AI) wins! Please Reset Game.'
                game_over = True
            elif check_draw(board):
                session['scores']['draws'] += 1
                session['status'] = 'Game is a draw! Please Reset Game.'
                game_over = True
            else:
                session['status'] = 'Player X\'s turn.'

    session['board'] = board
    session['game_over'] = game_over
    
    return jsonify({
        'board': board,
        'status': session['status'],
        'gameOver': game_over,
        'scores': session['scores']
    })

@app.route('/api/reset', methods=['POST'])
def api_reset():
    """Resets the game board but keeps the score."""
    session['board'] = [''] * 9
    session['status'] = 'Player X\'s turn.'
    session['game_over'] = False
    return jsonify({
        'board': session['board'],
        'status': session['status'],
        'gameOver': False,
        'scores': session['scores']
    })

@app.route('/api/reset_scores', methods=['POST'])
def api_reset_scores():
    """Resets the scores to zero."""
    session['scores'] = {'player': 0, 'ai': 0, 'draws': 0}
    return jsonify({
        'scores': session['scores']
    })


if __name__ == '__main__':
    app.run(debug=True)