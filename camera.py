import cv2



capture = cv2.VideoCapture(1)

while True:
    ret, image = capture.read()
    cv2.imshow('Camera stream', image)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break