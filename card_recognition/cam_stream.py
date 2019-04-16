import cv2

import numpy as np


class CardRecognition:
    def __init__(self, number=1):
        self.camera = cv2.VideoCapture(number)

        self.bulbasaur = cv2.imread('./Bulbasaur.png', 0)
        self.charmander = cv2.imread('./Charmander.png', 0)
        self.pikachu = cv2.imread('./Pikachu.png', 0)
        self.squirtle = cv2.imread('./Squirtle.png', 0)


    def create_cam_stream(self):
        self.success, self.frame = self.camera.read()
        return self.frame

    def show_frame(self):
        while True:
            cv2.imshow("Stream", self.create_cam_stream())
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    def read_qr_code(self):
        while True:
            frame = self.create_cam_stream()
            detector = cv2.QRCodeDetector()
            data, points, straight_qrcode = detector.detectAndDecode(frame)
            print(data)

    def show_matcher(self, image=None):
        frame = self.create_cam_stream()
        MIN_MATCHES = 20
        #####################################################################
        # Initiate SIFT detector #
        sift = cv2.xfeatures2d.SIFT_create()
        ####################################################################
        if image:
            img = image
        else:
            img=self.pikachu
        #####################################################################
        # finds the keypoints and descriptors
        # sift.detect() -> find image keypoints
        # sift.compute() -> computes teh descriptors from the keypoints
        # sift.detectAndCompute() -> directly find keypoints and descriptors
        keypoints_img1, descriptors_img = sift.detectAndCompute(img, None)
        ####################################################################

        ####################################################
        # Brute-force descriptor matcher
        bf = cv2.BFMatcher(cv2.NORM_L1, crossCheck=False)
        ####################################################q
        while True:
            cv2.imshow("Stream", frame)
            frame = self.create_cam_stream()
            keypoints_frame, descriptors_frame = sift.detectAndCompute(frame, None)

            ########################################################
            # Make matches with description from image and current frame
            matches = bf.match(descriptors_img, descriptors_frame)
            ########################################################
            # DMatch -> item.distance, item.trainIdx, item.queryIdx, item.imgIdx
            # sorted by distance
            matches = sorted(matches, key=lambda x: x.distance)
            if len(matches) > MIN_MATCHES:
                # pt - keypoints coordinate x,y -> Point2f -- coordinates of the keypoint
                # queryIdx -> from descriptors_img to keypoints_img (img1)
                # trainIdx -> from descriptors_frame to keypoints_ (img2)

                keypoints_image_xy = np.float32(
                    [keypoints_img1[match.queryIdx].pt for match in matches[:MIN_MATCHES]]).reshape(-1, 1,
                                                                                                    2)  # wiersze, kolumny, ilość elementów w kolumnie

                keypoints_frame_xy = np.float32(
                    [keypoints_frame[match.trainIdx].pt for match in matches[:MIN_MATCHES]]).reshape(-1, 1, 2)

                homography, mask = cv2.findHomography(keypoints_image_xy, keypoints_frame_xy, cv2.RANSAC, 5.0)
                #print('hom', homography)
                heigh, weigh = img.shape
                pts = np.float32([[0, 0], [0, heigh - 1], [weigh - 1, heigh - 1], [weigh - 1, 0]]).reshape(-1, 1, 2)
                dst = cv2.perspectiveTransform(pts, homography)

                frame = cv2.polylines(frame, [np.int32(dst)], True, 255, 3, cv2.LINE_AA)
                cv2.imshow('frame', frame)
                frame1 = cv2.drawMatches(img, keypoints_img1, frame, keypoints_frame, matches[:10], 0, flags=2)
                cv2.imshow('frame1', frame1)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

if __name__ == '__main__':
    cr = CardRecognition()
    cr.show_matcher()
