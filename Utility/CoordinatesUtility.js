const CoordinatesUtility = (function () {
    return { // Public Area
        /**
         * Return distance in pixels
         * @param point1
         * @param point2
         *
         * where point is:
         * {
         *  x: number,
         *  y: number
         * }
         * @returns {number}
         */
        getDistanceBetweenPoints: function (point1, point2) {
            return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
        },
    };
})();

export default CoordinatesUtility;
