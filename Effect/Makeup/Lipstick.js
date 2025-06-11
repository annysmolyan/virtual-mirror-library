import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import DrawUtility from "../../Utility/DrawUtility.js";

/**
 * Apply lipstick effect
 * @type {{apply: LipstickEffect.apply}}
 */
const LipstickEffect = (function () {

    // Private Area
    const defaults = {
        safariBlur: 2, //hardcoded value, never change!
        blur: 4,
        transparency: 0.3, // MIN 0.15 max 0.3
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

        if (!ColorUtility.isHexColor(obj.value)) {
            return false;
        }

        if (obj.saturation && (obj.saturation < 0 || obj.saturation > 1)) {
            return false;
        }

        if (obj.transparency && (obj.transparency < 0.15 || obj.transparency > 0.3)) {
            return false;
        }

        return true;
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
         *  "saturation": // from 0 to 1, OPTIONAL
         *  "transparency": // MIN 0.15 max 0.3 OPTIONAL
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
        apply: function (resultCanvasElement, lipsData, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid lipstick effect settings object.');
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

            maskCanvasContext.clearRect(0, 0, width, height);
            intermediateResultContext.clearRect(0, 0, width, height);

            let rgbDesiredColor = ColorUtility.getRgbFromHex(effectSettings.value);

            if (effectSettings.saturation) {
                rgbDesiredColor = ColorUtility.increaseSaturation(rgbDesiredColor, effectSettings.saturation)
            }

            // Draw and fill external lips contour
            DrawUtility.drawContour(
                maskCanvasContext,
                lipsData.externalLipsContourCoordinates,
                {fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`}
            );

            // Cut out internal lips contour
            DrawUtility.drawContour(
                maskCanvasContext,
                lipsData.internalLipsContourCoordinates,
                {fillStyle: 'white', globalCompositeOperation: 'destination-out'}
            );

            //Get current image from source canvas
            const sourceImage = resultCanvasContext.getImageData(0, 0, width, height);
            const sourceImageData = sourceImage.data;

            //Here the mask color will be applied
            const maskImageData = maskCanvasContext.getImageData(0, 0, width, height);
            const maskData = maskImageData.data;

            //take source image for mask manipulation
            intermediateResultContext = intermediateResultCanvas.getContext('2d');
            intermediateResultContext.putImageData(sourceImage, 0, 0);

            const resultImage = intermediateResultContext.getImageData(0, 0, width, height);
            const resultImageData = resultImage.data;

            let transparency = effectSettings.transparency ? effectSettings.transparency : defaults.transparency;

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
                        }

                        let appliedColor = ColorUtility.getAverageColor(sourcePixelRgb, rgbDesiredColor);

                        resultImageData[sourcePixelIndex] = appliedColor.r; // R channel (red)
                        resultImageData[sourcePixelIndex + 1] = appliedColor.g; // G channel (green)
                        resultImageData[sourcePixelIndex + 2] = appliedColor.b; // B channel (blue)
                        resultImageData[sourcePixelIndex + 3] = Math.round(transparency * 255); // A channel (alpha)
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
                resultCanvasContext.globalAlpha = transparency;
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

            resultCanvasContext.drawImage(intermediateResultCanvas, 0, 0);
            resultCanvasContext.filter = 'none';
            resultCanvasContext.globalAlpha = 1.0;
        }
    };
})();

export default LipstickEffect;
