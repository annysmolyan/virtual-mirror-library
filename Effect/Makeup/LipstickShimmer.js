import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import DrawUtility from "../../Utility/DrawUtility.js";
import TextureUtility from "../../Utility/TextureUtility.js";

/**
 * Apply shimmer lipstick effect
 * @type {{apply: ((function(*, *, *): Promise<void>)|*)}}
 */
const LipstickShimmerEffect = (function () {

    // Private Area
    const defaults = {
        safariBlur: 2, //hardcoded value, never change!
        blur: 4,
        transparency: 0.5, // MIN 0.15 max 0.5
        shimmerSize: 0.24,
        shimmerIntensity: 300
    };

    let maskCanvasElement = null; // will be used to make effect "behind the scene"
    let maskCanvasContext = null; // keep 2D rendering context for the canvas

    let shimmerCanvasElement = null; // will be used to make effect "behind the scene"
    let shimmerCanvasContext = null; // keep 2D rendering context for the canvas

    let intermediateResultCanvas = null; // will be used to make effect "behind the scene"
    let intermediateResultContext = null; // keep 2D rendering context for the canvas

    /**
     * Validate effect object
     * @param obj
     * @returns {boolean}
     */
    function isValidEffectSettings(obj) {
        if (!ColorUtility.isHexColor(obj.value)) {
            return false;
        }

        if (obj.transparency && (obj.transparency < 0.15 || obj.transparency > 0.5)) {
            return false;
        }

        return true;
    }

    /**
     * Return random coordinates by given size
     * @param coordinatesArray
     * @returns {string[]}
     */
    function getRandomCoordinates(coordinatesArray) {
        for (let i = coordinatesArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [coordinatesArray[i], coordinatesArray[j]] = [coordinatesArray[j], coordinatesArray[i]];
        }

        return coordinatesArray.slice(0, defaults.shimmerIntensity);
    }

    /**
     * Need to create an additional canvas which will be used to make effect "behind the scene"
     */
    function initMaskCanvas() {
        if (maskCanvasElement == undefined || maskCanvasElement == null) {
            maskCanvasElement = document.createElement('canvas');
            maskCanvasContext = maskCanvasElement.getContext('2d');
        }
    }

    /**
     * Need to create an additional canvas which will be used to simulate shimmer effect "behind the scene"
     */
    function initShimmerCanvas() {
        if (shimmerCanvasElement == undefined || shimmerCanvasElement == null) {
            shimmerCanvasElement = document.createElement('canvas');
            shimmerCanvasContext = shimmerCanvasElement.getContext('2d');
        }
    }

    /**
     * Keep intermediate effect result here
     */
    function initIntermediateResultCanvas() {
        if (intermediateResultCanvas == undefined || intermediateResultCanvas == null) {
            intermediateResultCanvas = document.createElement('canvas');
            intermediateResultContext = shimmerCanvasElement.getContext('2d');
        }
    }

    return { // Public Area

        /**
         * effect settings represents the following object:
         * {
         *  "type": "color",
         *  "value": "#0000",
         *  "transparency": 0.15-0.5 - optional
         * }
         *
         * lipsData represents the following object:
         * {
         *  "externalLipsContourCoordinates" : [{x: 000.22, y: 555}, .....],
         *  "internalLipsContourCoordinates": [{x: 000.22, y: 555}, .....];
         * }
         *
         * @param resultCanvasElement - canvas with source data, will be used to apply effect
         * @param lipsData
         * @param effectSettings
         */
        apply: async function (resultCanvasElement, lipsData, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid shimmer lipstick effect settings object.');
            }

            initMaskCanvas();
            initShimmerCanvas();
            initIntermediateResultCanvas();

            let resultCanvasContext = resultCanvasElement.getContext('2d');
            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize shimmer canvas aligned with source canvas
            shimmerCanvasElement.width = width;
            shimmerCanvasElement.height = height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            // resize intermediate canvas aligned with source canvas
            intermediateResultCanvas.width = width;
            intermediateResultCanvas.height = height;

            maskCanvasContext.clearRect(0, 0, width, height);
            shimmerCanvasContext.clearRect(0, 0, width, height);
            intermediateResultContext.clearRect(0, 0, width, height);

            let rgbDesiredColor = ColorUtility.getRgbFromHex(effectSettings.value);

            DrawUtility.drawContour( // Draw and fill external lips contour
                maskCanvasContext,
                lipsData.externalLipsContourCoordinates,
                {fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`}
            );

            DrawUtility.drawContour( // Cut out internal lips contour
                maskCanvasContext,
                lipsData.internalLipsContourCoordinates,
                {fillStyle: 'white', globalCompositeOperation: 'destination-out'}
            );

            //Get current image from source canvas
            const sourceImage = resultCanvasContext.getImageData(0, 0, width, height);
            const sourceImageData = sourceImage.data;

            //Get current image from shimmer canvas, process the image to get desired effect
            const shimmerImage = shimmerCanvasContext.getImageData(0, 0, width, height);
            const shimmerImageData = shimmerImage.data;

            //Here the mask color will be applied
            const maskImage = maskCanvasContext.getImageData(0, 0, width, height);
            const maskData = maskImage.data;

            //take source image for mask manipulation
            intermediateResultContext = intermediateResultCanvas.getContext('2d');
            intermediateResultContext.putImageData(sourceImage, 0, 0);

            const resultImage = intermediateResultContext.getImageData(0, 0, width, height);
            const resultImageData = resultImage.data;

            let lipsCoordinates = [];
            let transparency = effectSettings.transparency ? effectSettings.transparency : defaults.transparency;

            //replace lips pixels in mask
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const sourcePixelIndex = (y * sourceImage.width + x) * 4;
                    const maskPixelIndex = (y * maskImage.width + x) * 4;
                    const maskValue = maskData[maskPixelIndex];

                    if (maskValue > 0) {
                        lipsCoordinates.push({
                            x: x,
                            y: y,
                            offsetX: 1,
                            offsetY: 2,
                            speedX: Math.random() * 2 - 1, // Random horizontal speed
                            speedY: Math.random() * 2 - 1, // Random vertical speed
                        });

                        const sourcePixelRgb = {
                            r: sourceImageData[sourcePixelIndex],
                            g: sourceImageData[sourcePixelIndex + 1],
                            b: sourceImageData[sourcePixelIndex + 2]
                        }

                        let appliedColor = ColorUtility.getAverageColor(sourcePixelRgb, rgbDesiredColor);

                        resultImageData[sourcePixelIndex] = appliedColor.r; // R channel (red)
                        resultImageData[sourcePixelIndex + 1] = appliedColor.g; // G channel (green)
                        resultImageData[sourcePixelIndex + 2] = appliedColor.b; // B channel (blue)
                        resultImageData[sourcePixelIndex + 3] = Math.round(transparency * 255); // A channel (alpha)

                        // make transparent white bg for each shimmer
                        shimmerImageData[sourcePixelIndex] = 255; // R channel (red)
                        shimmerImageData[sourcePixelIndex + 1] = 255; // G channel (green)
                        shimmerImageData[sourcePixelIndex + 2] = 255; // B channel (blue)
                        shimmerImageData[sourcePixelIndex + 3] = Math.round(0.01 * 255); // A channel (alpha)
                    } else {
                        resultImageData[sourcePixelIndex + 3] = 0; // A channel (alpha) - remove pixels
                        shimmerImageData[sourcePixelIndex + 3] = 0; // A channel (alpha) - remove pixels
                    }
                }
            }

            intermediateResultContext.putImageData(resultImage, 0, 0);
            shimmerCanvasContext.putImageData(shimmerImage, 0, 0);

            // From lips mask, get random points and make shimmer dots from that point
            const randomShimmerCoordinates = getRandomCoordinates(lipsCoordinates);

            TextureUtility.applyShimmer(shimmerCanvasElement, randomShimmerCoordinates, defaults.shimmerSize);

            if (SafariUtility.isSafari()) {
                SafariUtility.setCanvas(intermediateResultCanvas);
                SafariUtility.gBlur(defaults.safariBlur);
                resultCanvasContext.globalAlpha = transparency;
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

            resultCanvasContext.drawImage(intermediateResultCanvas, 0, 0);

            resultCanvasContext.filter = 'none';
            resultCanvasContext.globalAlpha = 1.0;

            resultCanvasContext.drawImage(shimmerCanvasElement, 0, 0);
        }
    };
})();

export default LipstickShimmerEffect;
