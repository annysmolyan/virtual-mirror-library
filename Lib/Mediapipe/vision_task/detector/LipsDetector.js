import CoordinatesUtility from "../utils/coordinates_utils.js"

/**
 * Define lips and return object of detected coordinates
 * @type {{apply: BrowsColorEffect.apply}}
 */
const LipsDetector = (function () {

    const Y_INDEX = 'end';
    const X_INDEX = 'start';

    return {  // Public Area

        /**
         * Detect lips and return lips coordinates data object
         * @param sourceCanvasElement
         * @param landmarks
         * @param lipsPoints
         * @returns {{leftBrowContourCoordinates: *, rightBrowContourCoordinates: *}}
         */
        detect: function (sourceCanvasElement, landmarks, lipsPoints) {

            let width = sourceCanvasElement.width;
            let height = sourceCanvasElement.height;

            let externalBottomLipsContour = lipsPoints.slice(0, 10);
            let externalTopLipsContour = lipsPoints.slice(10, 20).reverse();
            let externalLipsContour = externalBottomLipsContour.concat(externalTopLipsContour);
            let externalLipsContourCoordinates = externalLipsContour.map(point => {
                return CoordinatesUtility.getPointCoordinates(landmarks, point[X_INDEX], width, height);
            });


            let internalBottomLipsContour = lipsPoints.slice(20, 30);
            let internalTopLipsContour = lipsPoints.slice(30, 40).reverse();
            let internalLipsContour = internalBottomLipsContour.concat(internalTopLipsContour);
            let internalLipsContourCoordinates = internalLipsContour.map(point => {
                return CoordinatesUtility.getPointCoordinates(landmarks, point[X_INDEX], width, height);
            });


            return {
                "externalLipsContourCoordinates": externalLipsContourCoordinates,
                "internalLipsContourCoordinates": internalLipsContourCoordinates
            }
        }
    };
})();

export default LipsDetector;
