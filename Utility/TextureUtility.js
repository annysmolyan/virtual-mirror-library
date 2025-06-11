const TextureUtility = (function () {
    return { // Public Area
        /**
         * Draw shimmer effect by coordinates
         * where coordinates represent the array of the following objects:
         *
         * {
         *  x: x,
         *  y: y,
         *  offsetX: 1,
         *  offsetY: 2,
         *  speedX: Math.random() * 2 - 1, // Random horizontal speed
         *  speedY: Math.random() * 2 - 1, // Random vertical speed
         * }
         *
         * @param canvas
         * @param shimmerCoordinates
         * @param shimmerSize
         */
        applyShimmer: function (canvas, shimmerCoordinates, shimmerSize) {
            shimmerCoordinates.forEach(shimmer => {
                let canvasContext = canvas.getContext('2d');
                canvasContext.fillStyle = '#ffffff';

                canvasContext.beginPath();
                canvasContext.arc(shimmer.x, shimmer.y, shimmerSize, 0, Math.PI * 2);
                canvasContext.fill();

                // Update glitter position
                shimmer.x += shimmer.speedX;
                shimmer.y += shimmer.speedY;

                // Wrap around canvas edges
                if (shimmer.x < 0 || shimmer.x > canvas.width) {
                    shimmer.x = shimmer.offsetX;
                }
                if (shimmer.y < 0 || shimmer.y > canvas.height) {
                    shimmer.y = shimmer.offsetY;
                }
            });
        }
    };
})();

export default TextureUtility;
