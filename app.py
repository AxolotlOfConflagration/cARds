from card_recognition.cam_stream import CardRecognition
import cv2 as cv
from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit
import eventlet, base64, json, random, time
eventlet.monkey_patch()

SLEEP_TIME = 0.1

app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True

socketio = SocketIO(app)

@app.route('/model/<path:path>')
def serve_model(path):
        return send_from_directory('models', path)

def send_coordinates():
        while True:
                randoms = [random.randint(0, 100) for p in range(0, 6)]
                socketio.emit('coordinates', json.dumps({
                        'id': 1,
                        'x': randoms[0],
                        'y': randoms[1],
                        'z': randoms[2],
                        'rx': randoms[3],
                        'ry': randoms[4],
                        'rz': randoms[5]
                        }))
                eventlet.sleep(SLEEP_TIME)

def stream_video():
        c = CardRecognition(0)
        while True:
                frame = c.create_cam_stream()
                _, buffer = cv.imencode('.jpg', frame)
                image = base64.b64encode(buffer).decode("utf-8") 
                socketio.emit('image', image)
                eventlet.sleep(SLEEP_TIME)

eventlet.spawn(stream_video)
eventlet.spawn(send_coordinates)

if __name__ == '__main__':
        socketio.run(app, use_reloader=False)