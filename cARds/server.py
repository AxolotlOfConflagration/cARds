from flask import Flask, render_template, send_from_directory
from flask_cors import CORS

SLEEP_TIME = 0.00001

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True

CORS(app)

@app.route('/')
def index():
        return render_template('aruco.html')

@app.route('/<path:path>')
def serve_model(path):
        return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(use_reloader=False, port=5000)