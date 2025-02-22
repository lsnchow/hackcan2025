from flask import Flask, request, jsonify
from flask_cors import CORS
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

    try:
        data = request.json
        product_names = []
        found_purchases = False  # Flag to track if "Your Items" section has started

        for product in data.get("products", []):
            product_text = product.get("text", "").strip()

            # If "Add to Cart" appears, we've reached the "Your Items" section
            if "Add to Cart" in product_text:
                found_purchases = True
            
            # If we haven't reached "Your Items", keep adding products
            if not found_purchases:
                # Extract product name by keeping only the first line (before the first newline)
                clean_name = product_text.split("\n")[0]

                # Avoid duplicates
                if clean_name not in product_names:
                    product_names.append(clean_name)

        # trimming the non-cart items
        product_names = product_names[7:]


        # Log extracted product names
        for i, product in enumerate(product_names):
            print(f"NUMBER {i+1}. {product}")

        response_data = {
            'status': 'success',
            'product_names': product_names
        }

        response = jsonify(response_data)
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
