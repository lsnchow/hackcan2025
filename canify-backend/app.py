from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import os

app = Flask(__name__)

# Allow all origins for testing
CORS(app, supports_credentials=True)

# Create data directory if it doesn't exist
DATA_DIR = os.path.join(os.path.dirname(__file__), 'cart_data')
os.makedirs(DATA_DIR, exist_ok=True)

@app.route('/api/cart-data', methods=['POST', 'OPTIONS'])
def receive_cart_data():
    # Handle preflight request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    print("Received request with headers:", dict(request.headers))
    try:
        data = request.json
        print("Received data:", data)
    
        
        response = jsonify({
            'status': 'success',
            'message': 'Data received and stored'
        })
        
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Listen on all interfaces 