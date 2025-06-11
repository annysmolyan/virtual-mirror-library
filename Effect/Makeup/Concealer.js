import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import CoordinatesUtility from "../../Utility/CoordinatesUtility.js";

/**
 * Apply concealer effect
 * @type {{apply: ConcealerEffect.apply}}
 */
const ConcealerEffect = (function () {

    const defaults = {
        blur: 4,
        safariBlur: 1, //hardcoded value don't change
        transparency: 0.25
    };

    let maskCanvasElement = null; // will be used to make effect "behind the scene"
    let maskCanvasContext = null; // keep 2D rendering context for the canvas

    let intermediateResultCanvas = null; // will be used to make effect "behind the scene"
    let intermediateResultContext = null; // keep 2D rendering context for the canvas

    let concealerPatternImage = null; // keep image object loaded once to save performance

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

    /**
     * Init image for concealer pattern
     * @param src
     * @returns {Promise<unknown>}
     */
    function initConcealerImage(src) {
        return new Promise((resolve, reject) => {
            concealerPatternImage = new Image();
            concealerPatternImage.onload = () => resolve(concealerPatternImage);
            concealerPatternImage.onerror = reject;
            concealerPatternImage.src = src;
        });
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
        apply: async function (resultCanvasElement, eyesData, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid concealer effect settings object.');
            }

            initMaskCanvas();
            initIntermediateResultCanvas();

            if (null == concealerPatternImage || undefined == concealerPatternImage) {
                await initConcealerImage("/mirror/Effect/Makeup/assets/concealer_right.png");//TODO
            }

            if (concealerPatternImage.width == 0) {
                return;
            }

            let resultCanvasContext = resultCanvasElement.getContext('2d');
            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            // resize intermediate canvas aligned with source canvas
            intermediateResultCanvas.width = width;
            intermediateResultCanvas.height = height;

            let angle = Math.atan2(eyesData.leftEyeCenter.y - eyesData.rightEyeCenter.y, eyesData.leftEyeCenter.x - eyesData.rightEyeCenter.x);
            let concealerPatternWidth = CoordinatesUtility.getDistanceBetweenPoints(eyesData.rightEyeLineTop[7], eyesData.rightEyeLineTop[0]) * 1.8;
            let originalAspectRatio = concealerPatternImage.width / concealerPatternImage.height;
            let concealerPatternHeight = concealerPatternWidth / originalAspectRatio;


            // paste concealer effect for right eye
            maskCanvasContext.translate(eyesData.rightEyeLineBottom[0].x , eyesData.rightEyeLineBottom[0].y);
            maskCanvasContext.rotate(angle);
            maskCanvasContext.drawImage(concealerPatternImage, -concealerPatternWidth / 4, -concealerPatternHeight / 45, concealerPatternWidth, concealerPatternHeight);


            maskCanvasContext.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation to identity matrix


            // paste concealer effect for left eye
            maskCanvasContext.translate(eyesData.leftEyeLineBottom[0].x , eyesData.leftEyeLineBottom[0].y);
            maskCanvasContext.scale(-1, 1);
            maskCanvasContext.rotate(-angle)
            maskCanvasContext.drawImage(concealerPatternImage, -concealerPatternWidth / 4, -concealerPatternHeight / 45, concealerPatternWidth, concealerPatternHeight);

            maskCanvasContext.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation to identity matrix


            //get mask image
            const maskImageData = maskCanvasContext.getImageData(0, 0, width, height);
            const maskData = maskImageData.data;

            //get current image from source canvas
            const sourceImage = resultCanvasContext.getImageData(0, 0, width, height);
            const sourceImageData = sourceImage.data;

            //take source image for mask manipulation
            intermediateResultContext = intermediateResultCanvas.getContext('2d');
            intermediateResultContext.putImageData(sourceImage, 0, 0);

            const resultImage = intermediateResultContext.getImageData(0, 0, width, height);
            const resultImageData = resultImage.data;

            let rgbDesiredColor = ColorUtility.getRgbFromHex(effectSettings.value);

            //replace concealer pixels in source
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
            resultCanvasContext.filter = 'none';
            resultCanvasContext.globalAlpha = 1.0;
        }
    };
})();

export default ConcealerEffect;