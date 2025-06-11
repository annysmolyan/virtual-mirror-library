import CoordinatesUtility from "../core/coordinates_utils.js";

/**
 * Define lips and return object of detected coordinates
 * @type {{apply: BrowsColorEffect.apply}}
 */
const LipsDetector = (function () {

    return {  // Public Area

        /**
         * Detect lips and return lips coordinates data object
         * @param resultCanvasElement
         * @param landmarks
         * @param lipsPoints
         * @returns {{leftBrowContourCoordinates: *, rightBrowContourCoordinates: *}}
         */
        detect: function (resultCanvasElement, landmarks, lipsPoints) {

            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            let externalBottomLipsContour = lipsPoints.slice(0, 10);
            let externalTopLipsContour = lipsPoints.slice(10, 20).reverse();
            let externalLipsContour = externalBottomLipsContour.concat(externalTopLipsContour)
            let externalLipsContourCoordinates = externalLipsContour.map(point => {
                return CoordinatesUtility.getPointCoordinates(landmarks, point[0], width, height);
            });

            let internalBottomLipsContour = lipsPoints.slice(20, 30);
            let internalTopLipsContour = lipsPoints.slice(30, 40).reverse();
            let internalLipsContour = internalBottomLipsContour.concat(internalTopLipsContour)
            let internalLipsContourCoordinates = internalLipsContour.map(point => {
                return CoordinatesUtility.getPointCoordinates(landmarks, point[0], width, height);
            });

            return {
                "externalLipsContourCoordinates": externalLipsContourCoordinates,
                "internalLipsContourCoordinates": internalLipsContourCoordinates
            }
        }
    };
})();

export default LipsDetector;
