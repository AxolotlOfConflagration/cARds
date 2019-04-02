import cv2




camera = cv2.VideoCapture(1)
success, frame = camera.read()
while success and cv2.waitKey(1) == -1 and ord('q'):
    cv2.imshow('Stream', frame)
    success, frame = camera.read()