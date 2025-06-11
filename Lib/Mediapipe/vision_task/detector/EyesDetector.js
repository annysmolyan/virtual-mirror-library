import CoordinatesUtility from "../utils/coordinates_utils.js";

/**
 * Define eyes and return object of detected coordinates
 * @type {{apply: BrowsColorEffect.apply}}
 */
const EyesDetector = (function () {

    const Y_INDEX = 'end';
    const X_INDEX = 'start';

    /**
     * @param landmarks
     * @param eyeCoordinates
     * @returns {{x: number, y: number}}
     */
    function getEyeCenter(landmarks, eyeCoordinates) {
        let centerX = eyeCoordinates.reduce((sum, point) => sum + point.x, 0) / eyeCoordinates.length;
        let centerY = eyeCoordinates.reduce((sum, point) => sum + point.y, 0) / eyeCoordinates.length;

        return {x: centerX, y: centerY};
    }

    return { // Public Area
        /**
         * Detect eyes and return eyes coordinates data object
         * @param sourceCanvasElement
         * @param landmarks
         * @param tesselationPoints
         * @param rightEyePoints
         * @param leftEyePoints
         * @returns {{leftBrowContourCoordinates: *, rightBrowContourCoordinates: *}}
         */
        detect: function (sourceCanvasElement, landmarks, tesselationPoints, rightEyePoints, leftEyePoints) {

            let width = sourceCanvasElement.width;
            let height = sourceCanvasElement.height;

            //right eye coordinates
            let rightPeakWing = [tesselationPoints[184][Y_INDEX]].map(point => {
                return CoordinatesUtility.getPointCoordinates(
                    landmarks, point, width, height
                );
            });
            let rightEyeLineBottom = rightEyePoints.slice(8).map(point => {
                return CoordinatesUtility.getPointCoordinates(
                    landmarks, point[X_INDEX], width, height,
                );
            });
            let rightEyeLineTop = rightEyePoints.slice(8).reverse().map(point => {
                return CoordinatesUtility.getPointCoordinates(
                    landmarks, point[X_INDEX], width, height, -4, -4
                );
            });

            //left eye coordinates
            let leftPeakWing = [tesselationPoints[2548][Y_INDEX]].map(point => {
                return CoordinatesUtility.getPointCoordinates(
                    landmarks, point, width, height
                );
            });
            let leftEyeLineBottom = leftEyePoints.slice(8).map(point => {
                return CoordinatesUtility.getPointCoordinates(
                    landmarks, point[X_INDEX], width, height
                );
            });
            let leftEyeLineTop = leftEyePoints.slice(8).reverse().map(point => {
                return CoordinatesUtility.getPointCoordinates(
                    landmarks, point[X_INDEX], width, height, -4, -4
                );
            });

            let leftEyeCoordinates = leftEyePoints.map(point => {
                return CoordinatesUtility.getPointCoordinates(landmarks, point[X_INDEX], width, height);
            });

            let rightEyeCoordinates = rightEyePoints.map(point => {
                return CoordinatesUtility.getPointCoordinates(landmarks, point[X_INDEX], width, height);
            });

            let leftEyeCenter = getEyeCenter(landmarks, leftEyeCoordinates);
            let rightEyeCenter = getEyeCenter(landmarks, rightEyeCoordinates);

            return {
                "rightPeakWing": rightPeakWing,
                "rightEyeLineBottom": rightEyeLineBottom,
                "rightEyeLineTop": rightEyeLineTop,
                "leftPeakWing": leftPeakWing,
                "leftEyeLineBottom": leftEyeLineBottom,
                "leftEyeLineTop": leftEyeLineTop,
                "leftEyeCoordinates": leftEyeCoordinates,
                "rightEyeCoordinates": rightEyeCoordinates,
                "leftEyeCenter": leftEyeCenter,
                "rightEyeCenter": rightEyeCenter,
            }
        }
    };
})();

export default EyesDetector;
