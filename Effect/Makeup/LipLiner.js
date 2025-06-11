import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";

/**
 * Apply lip-liner effect
 * @type {{apply: LipLinerEffect.apply}}
 */
const LipLinerEffect = (function () {

    // Private Area
    const defaults = {
        safariBlur: 2, //hardcoded value, never change!
        blur: 1.2,
        transparency: 0.3,
        width: 0.8,
    };

    let maskCanvasElement = null; // will be used to make effect "behind the scene"
    let maskCanvasContext = null; // keep 2D rendering context for the canvas

    /**
     * Validate effect object
     * @param obj
     * @returns {boolean}
     */
    function isValidEffectSettings(obj) {

        if (!ColorUtility.isHexColor(obj.value)) {
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
                throw new Error('Invalid lipliner effect settings object.');
            }

            initMaskCanvas();

            let resultCanvasContext = resultCanvasElement.getContext('2d');

            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            let rgbDesiredColor = ColorUtility.getRgbFromHex(effectSettings.value);

            maskCanvasContext.clearRect(0, 0, width, height);

            maskCanvasContext.beginPath();
            maskCanvasContext.moveTo(lipsData.externalLipsContourCoordinates[0].x, lipsData.externalLipsContourCoordinates[0].y); // Move to the first point

            // Draw lines to connect each point
            for (let i = 1; i < lipsData.externalLipsContourCoordinates.length; i++) {
                maskCanvasContext.lineTo(lipsData.externalLipsContourCoordinates[i].x, lipsData.externalLipsContourCoordinates[i].y);
            }

            // Connect the last point to the first point to close the contour
            maskCanvasContext.lineTo(lipsData.externalLipsContourCoordinates[0].x, lipsData.externalLipsContourCoordinates[0].y);

            // Set the line style and stroke the path
            maskCanvasContext.lineWidth = defaults.width;
            maskCanvasContext.strokeStyle = `rgb(${rgbDesiredColor.r} ${rgbDesiredColor.g} ${rgbDesiredColor.b})`;
            maskCanvasContext.stroke();

            if (SafariUtility.isSafari()) {
                SafariUtility.setCanvas(resultCanvasElement);
                SafariUtility.gBlur(defaults.safariBlur);
                resultCanvasContext.globalAlpha = defaults.transparency;
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

            resultCanvasContext.drawImage(
                maskCanvasElement,
                0, 0, width, height,
                0, 0, width, height
            );

            resultCanvasContext.filter = 'none';
            resultCanvasContext.globalAlpha = 1.0;
        }
    };
})();

export default LipLinerEffect;
