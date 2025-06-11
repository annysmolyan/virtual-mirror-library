const DrawUtility = (function () {
    return { // Public Area
        /**
         * Draw contour by provided coordinates
         *
         * @param canvasContext
         * @param coordinates
         * @param options
         */
        drawContour: function (canvasContext, coordinates, options = {}) {
            if (options.globalCompositeOperation) {
                canvasContext.globalCompositeOperation = options.globalCompositeOperation;
            }

            canvasContext.beginPath();

            for (let i = 0; i < coordinates.length; i++) {
                const point = coordinates[i];
                (i === 0) ? canvasContext.moveTo(point.x, point.y) : canvasContext.lineTo(point.x, point.y);
            }

            canvasContext.closePath();

            if (options.fillStyle) {
                canvasContext.fillStyle = options.fillStyle;
                canvasContext.fill();
            }

            if (options.lineWidth) {
                canvasContext.lineWidth = options.lineWidth;
            }

            if (options.strokeStyle) {
                canvasContext.strokeStyle = options.strokeStyle;
                canvasContext.stroke();
            }

            canvasContext.globalCompositeOperation = 'source-over'; //set to default value
        }
    };
})();

export default DrawUtility;
