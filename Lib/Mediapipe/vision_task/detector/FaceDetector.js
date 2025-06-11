import CoordinatesUtility from "../utils/coordinates_utils.js";

/**
 * Define face and return object of detected coordinates
 * @type {{apply: BrowsColorEffect.apply}}
 */
const FaceDetector = (function () {
    const Y_INDEX = 'end';
    const X_INDEX = 'start';

    return { // Public Area
        /**
         * Detect face and return face coordinates data object
         * @param resultCanvasElement
         * @param landmarks
         * @param faceOvalPoints
         * @returns {{leftBrowContourCoordinates: *, rightBrowContourCoordinates: *}}
         */
        detect: function (resultCanvasElement, landmarks, faceOvalPoints) {

            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            let faceOvalCoordinates = faceOvalPoints.map(point => {
                return CoordinatesUtility.getPointCoordinates(
                    landmarks, point[X_INDEX], width, height
                );
            });

            return {
                "faceOvalCoordinates": faceOvalCoordinates,
            }
        }
    };
})();

export default FaceDetector;
