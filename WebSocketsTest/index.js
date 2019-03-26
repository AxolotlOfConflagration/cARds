const path = require('path');
const express = require('express'); // import express server
const app = express(); // create express app
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cv = require('opencv4nodejs');
const cam = new cv.VideoCapture(0);

// endopint that will send back a file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

setInterval(() => {
    const frame = cam.read();
    const image = cv.imencode('.jpg', frame).toString('base64');
    io.emit('image', image);
}, 1000 / 30) 

app.listen(1337);