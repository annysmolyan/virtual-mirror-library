import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import DrawUtility from "../../Utility/DrawUtility.js";
import TextureUtility from "../../Utility/TextureUtility.js";

/**
 * Apply lip gloss effect
 * @type {{apply: LipstickEffect.apply}}
 */
const LipGlossEffect = (function () {

    // Private Area
    const defaults = {
        safariBlur: 2, //hardcoded value, never change!
        blur: 2,
        transparency: 0.5, // MIN 0.15 max 0.7
    };

    let maskCanvasElement = null; // will be used to make effect "behind the scene"
    let maskCanvasContext = null; // keep 2D rendering context for the canvas

    let intermediateResultCanvas = null; // will be used to make effect "behind the scene"
    let intermediateResultContext = null; // keep 2D rendering context for the canvas

    let glossCanvasElement = null; // will be used to make effect "behind the scene"
    let glossCanvasContext = null; // keep 2D rendering context for the canvas

    /**
     * Validate effect object
     * @param obj
     * @returns {boolean}
     */
    function isValidEffectSettings(obj) {
        if (!ColorUtility.isHexColor(obj.value)) {
            return false;
        }

        if (obj.transparency && (obj.transparency < 0.15 || obj.transparency > 0.7)) {
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

    /**
     * Need to create an additional canvas which will be used to simulate gloss effect "behind the scene"
     */
    function initGlossCanvas() {
        if (glossCanvasElement == undefined || glossCanvasElement == null) {
            glossCanvasElement = document.createElement('canvas');
            glossCanvasContext = glossCanvasElement.getContext('2d');
        }
    }

    return { // Public Area
        /**
         * effect settings represents the following object:
         * {
         *  "type": "color",
         *  "value": "#0000",
         *  "transparency": 0.3, // MIN 0.15 max 0.7 OPTIONAL
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
                throw new Error('Invalid lipgloss effect settings object.');
            }

            initMaskCanvas();
            initGlossCanvas();
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

            // resize gloss canvas aligned with source canvas
            glossCanvasElement.width = width;
            glossCanvasElement.height = height;

            maskCanvasContext.clearRect(0, 0, width, height);
            intermediateResultContext.clearRect(0, 0, width, height);
            glossCanvasContext.clearRect(0, 0, width, height);

            let rgbDesiredColor = ColorUtility.getRgbFromHex(effectSettings.value);

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



                        // Add gloss effect
                        // const glossOpacity = 0.1; // Adjust the gloss intensity here
                        // resultImageData[sourcePixelIndex] += 255 * glossOpacity; // Increase R channel
                        // resultImageData[sourcePixelIndex + 1] += 255 * glossOpacity; // Increase G channel
                        // resultImageData[sourcePixelIndex + 2] += 255 * glossOpacity;

                    }
                    else {
                        resultImageData[sourcePixelIndex + 3] = 0; // A channel (alpha) - remove pixels
                    }
                }
            }



            TextureUtility.applyShimmer(glossCanvasElement, [
                {
                    x: lipsData.externalLipsContourCoordinates[19].x+11,
                    y: lipsData.externalLipsContourCoordinates[19].y+1,
                    offsetX: 1,
                    offsetY: 2,
                    speedX: Math.random() * 2 - 1, // Random horizontal speed
                    speedY: Math.random() * 2 - 1, // Random vertical speed
                },
                {
                    x: lipsData.externalLipsContourCoordinates[18].x+15,
                    y: lipsData.externalLipsContourCoordinates[18].y-5,
                    offsetX: 1,
                    offsetY: 2,
                    speedX: Math.random() * 2 - 1, // Random horizontal speed
                    speedY: Math.random() * 2 - 1, // Random vertical speed
                },
                {
                    x: lipsData.externalLipsContourCoordinates[5].x,
                    y: lipsData.externalLipsContourCoordinates[5].y,
                    offsetX: 1,
                    offsetY: 2,
                    speedX: Math.random() * 2 - 1, // Random horizontal speed
                    speedY: Math.random() * 2 - 1, // Random vertical speed
                },
                {
                    x: lipsData.externalLipsContourCoordinates[5].x+15,
                    y: lipsData.externalLipsContourCoordinates[5].y-5,
                    offsetX: 1,
                    offsetY: 2,
                    speedX: Math.random() * 2 - 1, // Random horizontal speed
                    speedY: Math.random() * 2 - 1, // Random vertical speed
                },
                {
                    x: lipsData.externalLipsContourCoordinates[5].x+17,
                    y: lipsData.externalLipsContourCoordinates[5].y-6,
                    offsetX: 1,
                    offsetY: 2,
                    speedX: Math.random() * 2 - 1, // Random horizontal speed
                    speedY: Math.random() * 2 - 1, // Random vertical speed
                },
                {
                    x: lipsData.externalLipsContourCoordinates[5].x+20,
                    y: lipsData.externalLipsContourCoordinates[5].y-10,
                    offsetX: 1,
                    offsetY: 2,
                    speedX: Math.random() * 2 - 1, // Random horizontal speed
                    speedY: Math.random() * 2 - 1, // Random vertical speed
                }
            ], 1);





            intermediateResultContext.putImageData(resultImage, 0, 0);






            if (SafariUtility.isSafari()) {
                SafariUtility.setCanvas(intermediateResultCanvas);
                SafariUtility.gBlur(defaults.safariBlur);
                resultCanvasContext.globalAlpha = transparency;
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

            resultCanvasContext.drawImage(intermediateResultCanvas, 0, 0);
            // resultCanvasContext.filter = 'none';
            resultCanvasContext.globalAlpha = 1.0;


            resultCanvasContext.globalAlpha = 0.7;
            resultCanvasContext.drawImage(glossCanvasElement, 0, 0);
            resultCanvasContext.globalAlpha = 1.0;
            resultCanvasContext.filter = 'none';
        }
    };
})();

export default LipGlossEffect;
