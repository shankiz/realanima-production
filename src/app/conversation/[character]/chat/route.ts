# Placeholder backend code to demonstrate message deduction fixes.

from flask import Flask, request, jsonify
import time

app = Flask(__name__)

# Mock database (replace with actual database)
user_data = {
    "user1": {
        "messagesLeft": 10,
        "currentPlan": "basic"
    }
}

@app.route('/send_message', methods=['POST'])
def send_message():
    user_id = request.json.get('user_id')
    message = request.json.get('message')

    if user_id not in user_data:
        return jsonify({"error": "User not found"}), 404
    
    user = user_data[user_id]
    messages_left = user["messagesLeft"]
    current_plan = user["currentPlan"]

    if current_plan != 'ultimate' and messages_left <= 0:
        return jsonify({"error": "Not enough messages left"}), 400

    # Simulate message sending delay
    time.sleep(1)

    response = f"Message sent successfully: {message}"

    # Update message count after successful response
    final_messages_left = messages_left
    if current_plan != 'ultimate':
        final_messages_left = max(0, messages_left - 1)
        user_data[user_id]["messagesLeft"] = final_messages_left

    return jsonify({
        "response": response,
        "messagesLeft": -1 if current_plan == 'ultimate' else final_messages_left
    })

if __name__ == '__main__':
    app.run(debug=True)