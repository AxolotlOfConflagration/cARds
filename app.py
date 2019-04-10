import cv2 as cv
from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit
import eventlet, base64
eventlet.monkey_patch()

app = Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True

socketio = SocketIO(app)
capture = cv.VideoCapture(0)

@app.route('/model/<path:path>')
def serve_model(path):
        return send_from_directory('models', path)

def send_coordinates():
        pass

def stream_video():
    while True:
        _, frame = capture.read()
        _, buffer = cv.imencode('.jpg', frame)
        image = base64.b64encode(buffer).decode("utf-8") 
        socketio.emit('image', image)
        eventlet.sleep(0.1)

eventlet.spawn(stream_video)
eventlet.spawn(send_coordinates)

if __name__ == '__main__':
    socketio.run(app, use_reloader=False)