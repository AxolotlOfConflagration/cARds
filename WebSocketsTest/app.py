import cv2 as cv
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import eventlet
import base64
eventlet.monkey_patch()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True

socketio = SocketIO(app)
capture = cv.VideoCapture(0)

@app.route('/')
def index():
    return render_template('index.html')

def connect():
    while True:
        _, frame = capture.read()
        _, buffer = cv.imencode('.jpg', frame)
        image = base64.b64encode(buffer).decode("utf-8") 
        socketio.emit('image', image)
        eventlet.sleep(0.1)

eventlet.spawn(connect)

if __name__ == '__main__':
    socketio.run(app, use_reloader=False)