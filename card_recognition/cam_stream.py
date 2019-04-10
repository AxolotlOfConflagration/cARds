import cv2


class CardRecognition:
    def __init__(self):
        self.camera = cv2.VideoCapture(1)


    def create_cam_stream(self):
        self.success, self.frame = self.camera.read()
        return self.frame



if __name__ == '__main__':
    cr = CardRecognition()
    while True:
        print(cr.create_cam_stream())
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
