const CoordinatesUtility = (function () {

    return { // Public Area

        /**
         * @param {Object[]} landmarks - An array of landmark points.
         * @param {number} point - number of point in face landmarks
         * @param {number} canvasWidth - The width of the canvas.
         * @param {number} canvasHeight - The height of the canvas.
         * @param {number} [offsetX=0] - Optional X-axis offset.
         * @param {number} [offsetY=0] - Optional Y-axis offset.
         * @returns {{x: number, y: number}}
         */
        getPointCoordinates: function (
            landmarks,
            point,
            canvasWidth,
            canvasHeight,
            offsetX = 0,
            offsetY = 0
        ) {

            // Validate input parameters
            if (!Array.isArray(landmarks) || typeof point !== 'number' ||
                typeof canvasWidth !== 'number' || typeof canvasHeight !== 'number' ||
                typeof offsetX !== 'number' || typeof offsetY !== 'number') {
                throw new Error('Invalid input parameters for getPointCoordinates function.');
            }

            // Check if the specified point exists in the landmarks array
            if (!(point in landmarks)) {
                throw new Error('Point does not exist in landmarks array.');
            }

            return {
                x: (landmarks[point].x * canvasWidth) + offsetX,
                y: (landmarks[point].y * canvasHeight) + offsetY
            }
        },
    };
})();

export default CoordinatesUtility;
