import CoordinatesUtility from "../core/coordinates_utils.js";

/**
 * Define jaw and return object of detected coordinates
 * @type {{apply: BrowsColorEffect.apply}}
 */
const JawDetector = (function () {

    return { // Public Area
        /**
         * Detect jaw and return jaw coordinates data object
         * @param resultCanvasElement
         * @param landmarks
         * @param faceOvalPoints
         * @returns {{jawLeft: *, jawRight: *}}
         */
        detect: function (resultCanvasElement, landmarks, faceOvalPoints) {

            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            let jawLeft = CoordinatesUtility.getPointCoordinates(
                landmarks, faceOvalPoints[7][0], width, height
            );

            let jawRight = CoordinatesUtility.getPointCoordinates(
                landmarks, faceOvalPoints[29][0], width, height
            );

            return {
                "jawLeft": jawLeft,
                "jawRight": jawRight,
            }
        }
    };
})();

export default JawDetector;
