import CoordinatesUtility from "../utils/coordinates_utils.js";

/**
 * Define brows and return object of detected coordinates
 * @type {{apply: BrowsColorEffect.apply}}
 */
const BrowsDetector = (function () {

    const Y_INDEX = 'end';
    const X_INDEX = 'start';

    /**
     * Return eye brow contour point coordinates
     *
     * @param landmarks
     * @param eyebrowPoints
     * @param canvas
     * @returns {*}
     */
    function getEyebrowContourCoordinates(landmarks, eyebrowPoints, canvas) {
        let bottomContour = eyebrowPoints.slice(1, 4);
        let topContour = eyebrowPoints.slice(4).reverse();
        let contour = bottomContour.concat(
            [{'start': bottomContour.slice(-1)[0][Y_INDEX], 'end': topContour[0][Y_INDEX]}],
            topContour,
            [{'start': topContour.slice(-1)[0][X_INDEX], 'end': bottomContour[0][Y_INDEX]}],
        );
        return contour.map(point => {
            return CoordinatesUtility.getPointCoordinates(
                landmarks, point[X_INDEX], canvas.width, canvas.height
            );
        });
    }

    return { // Public Area
        /**
         * Detect contours coordinates of brows and return them
         * @param sourceCanvasElement
         * @param landmarks
         * @param rightBrowPoints
         * @param leftBrowPoints
         * @returns {{leftBrowContourCoordinates: *, rightBrowContourCoordinates: *}}
         */
        detect: function (sourceCanvasElement, landmarks, rightBrowPoints, leftBrowPoints) {

            let rightBrowContourCoordinates = getEyebrowContourCoordinates(
                landmarks, rightBrowPoints, sourceCanvasElement
            );

            let leftBrowContourCoordinates = getEyebrowContourCoordinates(
                landmarks, leftBrowPoints, sourceCanvasElement
            );

            return {
                "rightBrowContourCoordinates": rightBrowContourCoordinates,
                "leftBrowContourCoordinates": leftBrowContourCoordinates
            }
        }
    };
})();

export default BrowsDetector;
