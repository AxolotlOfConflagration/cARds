from card_recognition.cam_stream import CardRecognition
import cv2 as cv
from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import eventlet, base64, json, random, time
eventlet.monkey_patch()

SLEEP_TIME = 0.1

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True

CORS(app)

socketio = SocketIO(app)

@app.route('/')
def index():
        return render_template('modelShowcase.html', title='<3 C++ <3')

@app.route('/<path:path>')
def serve_model(path):
        return send_from_directory('.', path)

from itertools import cycle

def send_coordinates():
        tab = cycle([i for i in range(-20, 20)])
        nextelem = next(tab)
        while True:
                thiselem, nextelem = nextelem, next(tab)
                randoms = [random.randint(0, 20) for p in range(0, 4)]
                jsonV = json.dumps({
                        'id': 1,
                        'x': thiselem,
                        'y': nextelem,
                        'z': randoms[0],
                        'rx': randoms[1],
                        'ry': randoms[2],
                        'rz': randoms[3]
                        })
                socketio.emit('coordinates', jsonV)
                eventlet.sleep(SLEEP_TIME)

def stream_video():
        c = CardRecognition(0)
        while True:
                frame = c.matcher()
                _, buffer = cv.imencode('.jpg', frame)
                image = base64.b64encode(buffer).decode("utf-8") 
                socketio.emit('image', image)
                eventlet.sleep(SLEEP_TIME)

eventlet.spawn(stream_video)
eventlet.spawn(send_coordinates)

if __name__ == '__main__':
        socketio.run(app, use_reloader=False)