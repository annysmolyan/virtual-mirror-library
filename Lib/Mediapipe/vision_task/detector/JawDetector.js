import CoordinatesUtility from "../utils/coordinates_utils.js";

/**
 * Define jaw and return object of detected coordinates
 * @type {{apply: BrowsColorEffect.apply}}
 */
const JawDetector = (function () {

    const Y_INDEX = 'end';
    const X_INDEX = 'start';

    return { // Public Area
        /**
         * Detect jaw and return jaw coordinates data object
         * @param sourceCanvasElement
         * @param landmarks
         * @param faceOvalPoints
         * @returns {{leftBrowContourCoordinates: *, rightBrowContourCoordinates: *}}
         */
        detect: function (sourceCanvasElement, landmarks, faceOvalPoints) {

            let width = sourceCanvasElement.width;
            let height = sourceCanvasElement.height;

            let jawLeft = CoordinatesUtility.getPointCoordinates(
                landmarks, faceOvalPoints[7][X_INDEX], width, height
            );

            let jawRight = CoordinatesUtility.getPointCoordinates(
                landmarks, faceOvalPoints[29][X_INDEX], width, height
            );

            return {
                "jawLeft": jawLeft,
                "jawRight": jawRight,
            }
        }
    };
})();

export default JawDetector;
