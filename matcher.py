import cv2
import numpy as np

img = cv2.imread('zdj.jpg', 0)
cv2.imshow('foto', img)

camera = cv2.VideoCapture(0)
success, frame = camera.read()
camera.set(cv2.CAP_PROP_FPS, 30)

MIN_MATCHES = 10
orb = cv2.ORB_create()  # Initiate keypoint ORB detector

# create brute force  matcher object
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
# Find the  keypoints and descriptors
keypoints_img1, des_img = orb.detectAndCompute(img, None)


while success and cv2.waitKey(1) == -1 and ord('q'):
    cv2.imshow('Stream', frame)
    success, frame = camera.read()

    keypoints_frame, des_frame = orb.detectAndCompute(frame, None)

    try:
        matches = bf.match(des_img, des_frame)

        matches = sorted(matches, key=lambda x: x.distance)

        if len(matches) > MIN_MATCHES:

            src_pts = np.float32([keypoints_img1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([keypoints_frame[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)

            homography, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            #print('hom', homography)
            heigh, weigh = img.shape

            pts = np.float32([[0, 0], [0, heigh-5], [weigh-5, heigh-5], [weigh-5, 0]]).reshape(-1, 1, 2)

            dst = cv2.perspectiveTransform(pts, homography) #-> x,y 4 corners
            #print('dst', dst)

            frame = cv2.polylines(frame, [np.int32(dst)], True, 255, 3, cv2.LINE_AA)
            cv2.imshow('frame', frame)
            frame1 = cv2.drawMatches(img, keypoints_img1, frame, keypoints_frame, matches[:10], 0, flags=2)
            cv2.imshow('frame1', frame1)

    except:
        pass



