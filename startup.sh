source venv/bin/activate
pip install flask flask_cors
pip freeze > requirements.txt
pip install -r requirements.txt
python3 app.py
