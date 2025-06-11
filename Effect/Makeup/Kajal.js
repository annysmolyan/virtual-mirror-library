import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import DrawUtility from "../../Utility/DrawUtility.js";

/**
 * Apply kajal color effect
 * @type {{apply: EyelinerEffect.apply}}
 */
const KajalEffect = (function () {

    // Private Area
    const defaults = {
        blur: 2,
        safariBlur: 1, //hardcoded value don't change
        transparency: 0.5,
        width: 4
    };

    let maskCanvasElement = null; // will be used to make effect "behind the scene"
    let maskCanvasContext = null; // keep 2D rendering context for the canvas

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
                throw new Error('Invalid kajal effect settings object.');
            }

            initMaskCanvas();

            let resultCanvasContext = resultCanvasElement.getContext('2d');
            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            maskCanvasContext.lineWidth = 1;

            DrawUtility.drawContour(
                maskCanvasContext,
                eyesData.rightEyeCoordinates.slice(0,8).concat(eyesData.rightEyeCoordinates.slice(8,15).reverse()),
                {lineWidth: defaults.width, strokeStyle: effectSettings.value}
            );

            DrawUtility.drawContour(
                maskCanvasContext,
                eyesData.leftEyeCoordinates.slice(0,8).reverse().concat(eyesData.leftEyeCoordinates.slice(8,15)),
                {lineWidth: defaults.width, strokeStyle: effectSettings.value}
            );

            resultCanvasContext.globalAlpha = defaults.transparency;

            if (SafariUtility.isSafari()) {
                SafariUtility.setCanvas(maskCanvasElement);
                SafariUtility.gBlur(defaults.safariBlur);
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

            resultCanvasContext.drawImage(
                maskCanvasElement, 0, 0, width, height
            );

            // Reset filters and restore global transparency
            resultCanvasContext.filter = 'none';
            resultCanvasContext.globalAlpha = 1.0;
        }
    };
})();

export default KajalEffect;
