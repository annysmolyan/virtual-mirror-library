import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import DrawUtility from "../../Utility/DrawUtility.js";

/**
 * Apply satin eyeshadow color effect
 * @type {{apply: EyeShadowSatin.apply}}
 */
const EyeShadowSatin = (function () {

    // Private Area
    const defaults = {
        blur: 2.5,
        safariBlur: 1, //hardcoded value don't change
        transparency: 0.70
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
     * Keep intermediate effect result here
     */
    function initIntermediateResultCanvas() {
        if (intermediateResultCanvas == undefined || intermediateResultCanvas == null) {
            intermediateResultCanvas = document.createElement('canvas');
            intermediateResultContext = intermediateResultCanvas.getContext('2d');
        }
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

    return { // Public Area
        /**
         * effect settings represents the following object:
         * {
         *  "type": "color",
         *  "value": "#0000",
         * }
         *
         * eyesData represents the following object:
         * {
         *  "rightPeakWing": [{x: 000.22, y: 555}, .....],
         *  "rightEyeLineBottom": [{x: 000.22, y: 555}, .....],
         *  "rightEyeLineTop": [{x: 000.22, y: 555}, .....],
         *  "leftPeakWing": [{x: 000.22, y: 555}, .....],
         *  "leftEyeLineBottom": [{x: 000.22, y: 555}, .....],
         *  "leftEyeLineTop": [{x: 000.22, y: 555}, .....],
         *  "leftEyeCenter": [{x: 000.22, y: 555}, .....],
         *  "rightEyeCenter": [{x: 000.22, y: 555}, .....],
         * }
         *
         * @param resultCanvasElement
         * @param eyesData
         * @param effectSettings
         */
        apply: function (resultCanvasElement, eyesData, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid eyeshadow effect settings object.');
            }

            initMaskCanvas();
            initIntermediateResultCanvas();

            let resultCanvasContext = resultCanvasElement.getContext('2d');
            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;
            let rgbDesiredColor = ColorUtility.getRgbFromHex(effectSettings.value);

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            // resize intermediate canvas aligned with source canvas
            intermediateResultCanvas.width = width;
            intermediateResultCanvas.height = height;


            // determine right shadow line
            let rightShadowLine = eyesData.rightEyeLineTop.slice(0, 5).map(point => {
                return { ...point, y: point.y - 8 };
            });
            DrawUtility.drawContour(
                maskCanvasContext,
                eyesData.rightPeakWing.concat(eyesData.rightEyeLineBottom).concat(rightShadowLine),
                {
                    lineWidth: 3,
                    strokeStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`,
                    fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`
                }
            );


            // determine left shadow line
            let leftShadowLine = eyesData.leftEyeLineTop.slice(0, 5).map(point => {
                return { ...point, y: point.y - 8 };
            });
            DrawUtility.drawContour(
                maskCanvasContext,
                eyesData.leftEyeLineBottom.concat(leftShadowLine).concat(eyesData.leftPeakWing),
                {
                    lineWidth: 3,
                    strokeStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`,
                    fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`
                }
            );

            resultCanvasContext.globalAlpha = defaults.transparency;

            if (SafariUtility.isSafari()) {
                SafariUtility.setCanvas(maskCanvasElement);
                SafariUtility.gBlur(defaults.safariBlur);
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

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

            //replace eyeshadow pixels in mask
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
                        resultImageData[sourcePixelIndex + 3] = Math.round(defaults.transparency * 255); // A channel (alpha)
                    }
                    else {
                        resultImageData[sourcePixelIndex + 3] = 0; // A channel (alpha) - remove pixels
                    }
                }
            }

            intermediateResultContext.putImageData(resultImage, 0, 0);
            resultCanvasContext.drawImage(intermediateResultCanvas, 0, 0);

            // Reset filters and restore global transparency
            resultCanvasContext.filter = 'none';
            resultCanvasContext.globalAlpha = 1.0;
        }
    };
})();

export default EyeShadowSatin;
