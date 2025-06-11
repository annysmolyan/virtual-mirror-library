import CoordinatesUtility from "../../Utility/CoordinatesUtility.js";

/**
 * Apply eyeglass effect
 * @type {{apply: EyeGlassesEffect.apply}}
 */
const EyeGlassesEffect = (function () {

    let maskCanvasElement = null; // will be used to make effect "behind the scene"
    let maskCanvasContext = null; // keep 2D rendering context for the canvas
    let glassesImage = null; // keep image object loaded once to save performance

    /**
     * Validate effect object
     * @param obj
     * @returns {boolean}
     */
    function isValidEffectSettings(obj) {

        if (!obj.value) {
            return false;
        }

        if (obj.type != 'image') {
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
     * Init
     * @param src
     * @returns {Promise<unknown>}
     */
    function initEyeglassImage(src) {
        return new Promise((resolve, reject) => {
            glassesImage = new Image();
            glassesImage.onload = () => resolve(glassesImage);
            glassesImage.onerror = reject;
            glassesImage.src = src;
        });
    }

    return { // Public Area

        /**
         * effect settings represents the following object:
         * {
         *  "type": "image",
         *  "value": "http_link_to_image",
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
         * jawData represents the following object:
         * {
         *   "jawLeft": [{x: 000.22, y: 555}, .....],
         *   "jawRight": [{x: 000.22, y: 555}, .....],
         * }
         *
         * @param resultCanvasElement
         * @param eyesData
         * @param jawData
         * @param effectSettings
         */
        apply: async function (resultCanvasElement, eyesData, jawData, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid glasses effect settings object.');
            }

            initMaskCanvas();

            if (null == glassesImage || undefined == glassesImage || glassesImage.src != effectSettings.value) {
                await initEyeglassImage(effectSettings.value);
            }

            let resultCanvasContext = resultCanvasElement.getContext('2d');
            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            let angle = Math.atan2(eyesData.leftEyeCenter.y - eyesData.rightEyeCenter.y, eyesData.leftEyeCenter.x - eyesData.rightEyeCenter.x);

            let glassesCenterX = (eyesData.leftEyeCenter.x + eyesData.rightEyeCenter.x) / 2;
            let glassesCenterY = (eyesData.leftEyeCenter.y + eyesData.rightEyeCenter.y) / 2;

            let glassesWidth = CoordinatesUtility.getDistanceBetweenPoints(jawData.jawLeft, jawData.jawRight) * 2.2;
            let originalAspectRatio = glassesImage.width / glassesImage.height;
            let glassesHeight = glassesWidth / originalAspectRatio;

            maskCanvasContext.translate(glassesCenterX, glassesCenterY);
            maskCanvasContext.rotate(angle);
            maskCanvasContext.drawImage(glassesImage, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight);

            //display the result
            resultCanvasContext.drawImage(maskCanvasElement, 0, 0, width, height);
        }
    };
})();

export default EyeGlassesEffect;
