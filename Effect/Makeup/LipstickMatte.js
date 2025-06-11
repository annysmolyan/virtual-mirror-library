import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import DrawUtility from "../../Utility/DrawUtility.js";

/**
 * Apply matte lipstick effect
 * @type {{apply: LipstickMatteEffect.apply}}
 */
const LipstickMatteEffect = (function () {

    // Private Area
    const defaults = {
        safariBlur: 2, //hardcoded value, never change!
        blur: 2,
        transparency: 0.5
    };

    let maskCanvasElement = null; // will be used to make effect "behind the scene"
    let maskCanvasContext = null; // keep 2D rendering context for the canvas

    let intermediateResultCanvas = null; // will be used to make effect "behind the scene"
    let intermediateResultContext = null; // keep 2D rendering context for the canvas

    /**
     * Validate effect object
     * @param obj
     * @returns {boolean}
     */
    function isValidEffectSettings(obj) {
        return ColorUtility.isHexColor(obj.value);
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
     * Keep intermediate effect result here
     */
    function initIntermediateResultCanvas() {
        if (intermediateResultCanvas == undefined || intermediateResultCanvas == null) {
            intermediateResultCanvas = document.createElement('canvas');
            intermediateResultContext = intermediateResultCanvas.getContext('2d');
        }
    }

    return { // Public Area

        /**
         * effect settings represents the following object:
         * {
         *  "type": "color",
         *  "value": "#0000",
         * }
         *
         * lipsData represents the following object:
         * {
         *   "externalLipsContourCoordinates" : [{x: 000.22, y: 555}, .....],
         *   "internalLipsContourCoordinates": [{x: 000.22, y: 555}, .....];
         * }
         * @param resultCanvasElement - canvas with source data, will be used to apply effect
         * @param lipsData
         * @param effectSettings
         */
        apply: function (resultCanvasElement, lipsData, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid matte lipstick effect settings object.');
            }

            initMaskCanvas();
            initIntermediateResultCanvas();

            let resultCanvasContext = resultCanvasElement.getContext('2d');
            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            // resize intermediate canvas aligned with source canvas
            intermediateResultCanvas.width = width;
            intermediateResultCanvas.height = height;

            let rgbDesiredColor = ColorUtility.getRgbFromHex(effectSettings.value);

            maskCanvasContext.clearRect(0, 0, width, height);
            intermediateResultContext.clearRect(0, 0, width, height);

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

            const maskImageData = maskCanvasContext.getImageData(0, 0, width, height);
            const maskData = maskImageData.data;

            //take source image for mask manipulation
            intermediateResultContext = intermediateResultCanvas.getContext('2d');
            intermediateResultContext.putImageData(sourceImage, 0, 0);

            const resultImage = intermediateResultContext.getImageData(0, 0, width, height);
            const resultImageData = resultImage.data;

            //replace lips pixels in mask
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const sourcePixelIndex = (y * sourceImage.width + x) * 4;
                    const maskPixelIndex = (y * maskImageData.width + x) * 4;

                    const maskValue = maskData[maskPixelIndex];

                    if (maskValue > 0) {
                        const sourcePixelRgb = {
                            r: sourceImageData[sourcePixelIndex],
                            g: sourceImageData[sourcePixelIndex + 1],
                            b: sourceImageData[sourcePixelIndex + 2]
                        };

                        let appliedColor = ColorUtility.interpolateColors(
                            rgbDesiredColor,
                            sourcePixelRgb,
                            80,
                            defaults.transparency
                        );
                        appliedColor = ColorUtility.toMatteColor(appliedColor);

                        resultImageData[sourcePixelIndex] = appliedColor.r; // R channel (red)
                        resultImageData[sourcePixelIndex + 1] = appliedColor.g; // G channel (green)
                        resultImageData[sourcePixelIndex + 2] = appliedColor.b; // B channel (blue)
                        resultImageData[sourcePixelIndex + 3] = Math.round(defaults.transparency * 255); // A channel (alpha)
                    }
                    else {
                        resultImageData[sourcePixelIndex + 3] = 0; // A channel (alpha) - remove pixels
                    }
                }
            }

            intermediateResultContext.putImageData(resultImage, 0, 0);

            if (SafariUtility.isSafari()) {
                SafariUtility.setCanvas(intermediateResultCanvas);
                SafariUtility.gBlur(defaults.safariBlur);
                resultCanvasContext.globalAlpha = defaults.transparency;
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

            resultCanvasContext.drawImage(intermediateResultCanvas, 0, 0);
            resultCanvasContext.filter = 'none';
            resultCanvasContext.globalAlpha = 1.0;
        }
    };
})();

export default LipstickMatteEffect;