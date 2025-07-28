from flask import Flask, request, jsonify
import json

app = Flask(__name__)

# In-memory storage (for demo purposes; in a real-world scenario, use a database)
users_db = {}

@app.route('/register', methods=['POST'])
async def register():
    try:
        # Get data from the request
        data = await request.json
        
        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')

        if not username or not password:
            return jsonify({"message": "Username and password are required"}), 400

        if username in users_db:
            return jsonify({"message": "Username already exists!"}), 400

        # Here you would hash the password before storing it
        users_db[username] = {'password': password, 'email': email}

        return jsonify({"message": "Registration successful!"}), 200

    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000)
