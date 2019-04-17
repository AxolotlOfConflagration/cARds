import cv2
import numpy as np

class CardRecognition:
    def __init__(self, number):
        self.camera = cv2.VideoCapture(number)

        self.bulbasaur = cv2.imread('card_recognition//Bulbasaur.png', 0)
        self.charmander = cv2.imread('card_recognition//Charmander.png', 0)
        self.pikachu = cv2.imread('card_recognition/Pikachu.png', 0)
        self.squirtle = cv2.imread('card_recognition//Squirtle.png', 0)

    def create_cam_stream(self):
        self.success, self.frame = self.camera.read()
        return self.frame

    def matcher(self):
        frame = self.create_cam_stream()
        # detector = cv2.QRCodeDetector()
        # data, points, straight_qrcode = detector.detectAndDecode(frame)
        # print(data)
        MIN_MATCHES = 20
        #####################################################################
        # Initiate SIFT detector #
        sift = cv2.xfeatures2d.SIFT_create()
        ####################################################################

        img = self.pikachu
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

        #cv2.imshow("Stream", frame)
        #frame = self.create_cam_stream()
        keypoints_frame, descriptors_frame = sift.detectAndCompute(frame, None)

        ########################################################
        # Make matches with description from image and current frame
        try:
            matches = bf.match(descriptors_img, descriptors_frame)
            ########################################################q
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
                # print('hom', homography)
                heigh, weigh = img.shape
                pts = np.float32([[0, 0], [0, heigh - 1], [weigh - 1, heigh - 1], [weigh - 1, 0]]).reshape(-1, 1, 2)
                dst = cv2.perspectiveTransform(pts, homography)

                frame = cv2.polylines(frame, [np.int32(dst)], True, 255, 3, cv2.LINE_AA)
                # cv2.imshow('frame', frame)
                frame1 = cv2.drawMatches(img, keypoints_img1, frame, keypoints_frame, matches[:10], 0, flags=2)
                # cv2.imshow('frame1', frame1)
                return frame
        except:
            pass

