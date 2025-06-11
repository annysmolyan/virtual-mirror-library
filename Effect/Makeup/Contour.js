import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import DrawUtility from "../../Utility/DrawUtility.js";

/**
 * Apply contour/bronzer effect
 * @type {{apply: ContourEffect.apply}}
 */
const ContourEffect = (function () {

    // Private Area
    const defaults = {
        blur: 5,
        safariBlur: 1, //hardcoded value don't change
        transparency: 0.3
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
         * detectionData represents the following object:
         * {
         *  "faceOval": [{x: 000.22, y: 555}, .....],
         * }
         *
         * @param resultCanvasElement
         * @param detectionData
         * @param effectSettings
         */
        apply: function (resultCanvasElement, detectionData, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid contour effect settings object.');
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

            // prolong face top oval
            for (var i = 0; i < 36; i++) {
                if (i < 7 || (i >= 30 && i < 36)) {
                    detectionData.faceOvalCoordinates[i].y -= 25;
                }
            }

            // Draw and fill face contour

            //left forehead
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.faceOvalCoordinates.slice(1,7),
                {fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`}
            );

            //right forehead
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.faceOvalCoordinates.slice(30,36),
                {fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`}
            );

            //left chin
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.faceOvalCoordinates.slice(12,18),
                {fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`}
            );

            //right chin
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.faceOvalCoordinates.slice(19,25),
                {fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`}
            );

            //left cheekbone
            let leftCheekbone = detectionData.faceOvalCoordinates.slice(8,12);

            leftCheekbone[3].y -= 50;
            leftCheekbone[3].x -= 15;

            DrawUtility.drawContour(
                maskCanvasContext,
                leftCheekbone,
                {fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`}
            );


            //right cheekbone
            let rightCheekbone = detectionData.faceOvalCoordinates.slice(26,29);

            rightCheekbone[1].y += 1;
            rightCheekbone[1].x += 22;

            DrawUtility.drawContour(
                maskCanvasContext,
                rightCheekbone,
                {fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`}
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

            // apply contour
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

            if (SafariUtility.isSafari()) {
                SafariUtility.setCanvas(intermediateResultCanvas);
                SafariUtility.gBlur(defaults.safariBlur);
                resultCanvasContext.globalAlpha = defaults.transparency;
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

            resultCanvasContext.drawImage(intermediateResultCanvas, 0, 0);
            resultCanvasContext.globalAlpha = 1.0;
            resultCanvasContext.filter = 'none';
        }
    };
})();

export default ContourEffect;
