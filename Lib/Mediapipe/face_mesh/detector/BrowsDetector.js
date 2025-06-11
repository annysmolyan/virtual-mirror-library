import CoordinatesUtility from "../core/coordinates_utils.js";

/**
 * Define brows and return object of detected coordinates
 * @type {{apply: BrowsColorEffect.apply}}
 */
const BrowsDetector = (function () {

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
            [[bottomContour.slice(-1)[0][1], topContour[0][1]]],
            topContour,
            [[topContour.slice(-1)[0][0], bottomContour[0][1]]],
        );
        return contour.map(point => {
            return CoordinatesUtility.getPointCoordinates(
                landmarks, point[0], canvas.width, canvas.height
            );
        });
    }

    return { // Public Area
        /**
         * Detect contours coordinates of brows and return them
         * @param resultCanvasElement
         * @param landmarks
         * @param leftEyebrowPoints
         * @param rightEyebrowPoints
         * @returns {{leftBrowContourCoordinates: *, rightBrowContourCoordinates: *}}
         */
        detect: function (resultCanvasElement, landmarks, leftEyebrowPoints, rightEyebrowPoints) {

            let rightBrowContourCoordinates = getEyebrowContourCoordinates(
                landmarks, rightEyebrowPoints, resultCanvasElement
            );

            let leftBrowContourCoordinates = getEyebrowContourCoordinates(
                landmarks, leftEyebrowPoints, resultCanvasElement
            );

            return {
                "rightBrowContourCoordinates": rightBrowContourCoordinates,
                "leftBrowContourCoordinates": leftBrowContourCoordinates
            }
        }
    };
})();

export default BrowsDetector;
