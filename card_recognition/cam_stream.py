import cv2
import numpy as np

class CardRecognition:
    def __init__(self, number=1):
        self.camera = cv2.VideoCapture(number)
        self.bulbasaur = cv2.imread('Bulbasaur.png', 0)
        # cv2.imshow('asd', self.bulbasaur)
        self.charmander = cv2.imread('Charmander.png', 0)
        self.pikachu = cv2.imread('Pikachu.png', 0)
        self.squirtle = cv2.imread('Squirtle.png', 0)

    def create_cam_stream(self):
        self.success, self.frame = self.camera.read()
        return self.frame

    def show_frame(self):
        while True:
            cv2.imshow("Stream", self.create_cam_stream())
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    def show_matcher(self, image=None):
        frame = self.create_cam_stream()
        min_matches = 20
        sift = cv2.xfeatures2d.SIFT_create()  # Initiate keypoint SIFT detector
        bf = cv2.BFMatcher(cv2.NORM_L1, crossCheck=False)

        if image:
            img = image
        else:
            img=self.pikachu
        keypoints_img, des_img = sift.detectAndCompute(img, None)


        while True:

            cv2.imshow("Stream", frame)
            frame = self.create_cam_stream()
            keypoints_frame, des_frame = sift.detectAndCompute(frame, None)

            matches = bf.match(des_img, des_frame)
            matches = sorted(matches, key=lambda x: x.distance)
            if len(matches) > min_matches:
                src_pts = np.float32([keypoints_img[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
                dst_pts = np.float32([keypoints_frame[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)

                homography, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
                #print('hom', homography)
                heigh, weigh = img.shape
                pts = np.float32([[0, 0], [0, heigh - 1], [weigh - 1, heigh - 1], [weigh - 1, 0]]).reshape(-1, 1, 2)
                dst = cv2.perspectiveTransform(pts, homography)

                frame = cv2.polylines(frame, [np.int32(dst)], True, 255, 3, cv2.LINE_AA)
                cv2.imshow('frame', frame)
                frame1 = cv2.drawMatches(img, keypoints_img, frame, keypoints_frame, matches[:10], 0, flags=2)
                cv2.imshow('frame1', frame1)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break


if __name__ == '__main__':
    cr = CardRecognition(0)
    cr.show_matcher()
