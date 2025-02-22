python3 -m venv venv
source venv\Scripts\activate
pip install flask flask_cors
pip freeze > requirements.txt
pip install -r requirements.txt
python3 canify-backend\app.py

