import cv2
import numpy as np

import glob
import cv2.aruco as aruco
import os
import json


class CardRecognition:
    def __init__(self, number):
        self.camera = cv2.VideoCapture(number)
        self.path = os.path.realpath('card_recognition/CameraCalibration/img/*.bmp').replace("\\", "/")


    def create_cam_stream(self):
        self.success, self.frame = self.camera.read()
        return self.frame

    def show_frame(self):
        while True:
            cv2.imshow("Stream", self.create_cam_stream())
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    def calibrantion_cam_1(self):
        # termination criteriaq
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)
        # prepare object points, like (0,0,0), (1,0,0), (2,0,0) ....,(6,5,0)
        # checkerboard Dimensions
        cbrow = 6
        cbcol = 5

        objp = np.zeros((cbrow * cbcol, 3), np.float32)
        objp[:, :2] = np.mgrid[0:cbcol, 0:cbrow].T.reshape(-1, 2)
        # Arrays to store object points and image points from all the images.
        objpoints = []  # 3d point in real world space
        imgpoints = []  # 2d points in image plane.

        for fname in glob.glob(self.path):
            print(fname)
            img = cv2.imread(fname)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Find the chess board corners
            ret, corners = cv2.findChessboardCorners(gray, (cbcol, cbrow), criteria)

            # If found, add object points, image points (after refining them)
            if ret == True:
                objpoints.append(objp)
                imgpoints.append(corners)


        return objpoints, imgpoints, gray

    def get_cam_matrix(self, objpoints, imgpoints, gray):

        ret, camera_matrix, dist_coeffs, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, gray.shape[::-1],
                                                                            None, None)
        return camera_matrix, dist_coeffs

    def write_cam_parameters_to_file(self):
        objpoints, imgpoints, gray = self.calibrantion_cam_1()

        camera_matrix, dist_coeffs = self.get_cam_matrix(objpoints, imgpoints, gray)

        camera = {
            "camera_matrix": camera_matrix.tolist(),
            "dist_coeff": dist_coeffs.tolist()
        }

        with open("camera.json", "w") as f:
            json.dump(camera, f)

    def get_camera_parameters_from_file(self):
        try:
            with open("camera.json", 'r') as f:
                camera = json.load(f)
                camera_matrix = np.array(camera['camera_matrix'])
                dist_coeffs = np.array(camera['dist_coeff'])
                return camera_matrix, dist_coeffs
        except:
            return np.array([]),np.array([])



    def detect_aruco(self, image):
        image_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        aruco_dict = aruco.Dictionary_get(aruco.DICT_4X4_100)

        parameters = aruco.DetectorParameters_create()

        corners, ids, _ = aruco.detectMarkers(image_gray, aruco_dict, parameters=parameters)

        return corners, ids

    def get_rotation_and_translation(self,corners,camera_matrix, dist_coeffs, markerLength = 25):

        rvec, tvec, _ = aruco.estimatePoseSingleMarkers(corners, markerLength, camera_matrix, dist_coeffs)

        return rvec, tvec

    def get_camera_parameters(self):
        camera_matrix, dist_coeffs = self.get_camera_parameters_from_file()
        if  len(camera_matrix)==0:
            self.write_cam_parameters_to_file()
            camera_matrix, dist_coeffs = self.get_camera_parameters_from_file()
        return  camera_matrix, dist_coeffs
    def get_corners_and_rortation_and_translation(self, frame):

        # objpoints, imgpoints, gray = self.calibrantion_cam_1()
        # camera_matrix, dist_coeffs = self.get_cam_matrix(objpoints, imgpoints, gray)
        camera_matrix, dist_coeffs = self.get_camera_parameters()

        corners, ids = self.detect_aruco(frame)
        rvec, tvec = self.get_rotation_and_translation(corners, camera_matrix, dist_coeffs)

        return corners, rvec, tvec, ids

    def test_cor_ror_tran(self):
        while True:
            frame = self.create_cam_stream()
            corners, rvec, tvec, ids = self.get_corners_and_rortation_and_translation(frame)
            print("corners")
            print(corners)
            print("rvec")
            print(rvec)
            print("tvec")
            print(tvec)
            print("ids")
            print(ids)


    def show_asix(self):

        # objpoints, imgpoints, gray = self.calibrantion_cam_1()
        # camera_matrix, dist_coeffs = self.get_cam_matrix(objpoints, imgpoints, gray)
        camera_matrix, dist_coeffs = self.get_camera_parameters()
        while True:
            frame = self.create_cam_stream()
            corners, ids = self.detect_aruco(frame)

            rvec, tvec = self.get_rotation_and_translation(corners,camera_matrix, dist_coeffs)



            try:
                if len(rvec>0):
                    for i in range(0, len(rvec)):
                        cv2.aruco.drawAxis(frame, camera_matrix, dist_coeffs, rvec[i], tvec[i], 10)
            except:
                pass
            cv2.imshow('test2', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break





if __name__ == '__main__':
    cr = CardRecognition(1)
    #cr.show_asix()
    cr.test_cor_ror_tran()


    #cr.write_cam_parameters_to_file()
    #print(cr.get_camera_parameters_from_file())


