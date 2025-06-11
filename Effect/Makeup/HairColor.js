import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";

/**
 * Apply hair color effect
 * @type {{apply: HairColorEffect.apply}}
 */
const HairColorEffect = (function () {

    // Private Area
    const defaults = {
        threshold: 0.6,
        transparency: 0.6,
        blur: 5,
        blendFactor: 80, //hardcoded value don't change,
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

        if (obj.saturation && (obj.saturation < 0 || obj.saturation > 1)) {
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
         *  "saturation": // from 0 to 1
         * }
         * @param resultCanvasElement
         * @param effectSettings
         */
        apply: function (resultCanvasElement, hairMask, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid hair color effect settings object.');
            }

            initMaskCanvas();

            let resultCanvasContext = resultCanvasElement.getContext('2d');

            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            // Get image data from sourceCanvasContext
            let imageData = resultCanvasContext.getImageData(
                0,
                0,
                width,
                height
            );

            let j = 0;
            let rgbDesiredColor = ColorUtility.getRgbFromHex(effectSettings.value);

            if (effectSettings.saturation) {
                rgbDesiredColor = ColorUtility.increaseSaturation(rgbDesiredColor, effectSettings.saturation)
            }

            for (let i = 0; i < hairMask.length; ++i) {
                if (hairMask[i] > defaults.threshold) {
                    const originalColor = {
                        r: imageData.data[j],
                        g: imageData.data[j + 1],
                        b: imageData.data[j + 2],
                    };

                    const appliedColor = ColorUtility.interpolateColors(
                        rgbDesiredColor,
                        originalColor,
                        defaults.blendFactor,
                        defaults.transparency
                    );

                    imageData.data[j] = appliedColor.r; // Red
                    imageData.data[j + 1] = appliedColor.g; // Green
                    imageData.data[j + 2] = appliedColor.b; // Blue
                    imageData.data[j + 3] = appliedColor.a; // Alpha
                } else { //remove color
                    imageData.data[j] = 0;     // Red
                    imageData.data[j + 1] = 0; // Green
                    imageData.data[j + 2] = 0; // Blue
                    imageData.data[j + 3] = 0; // alpha
                }
                j += 4;
            }

            // Draw new image data on hairCanvas
            maskCanvasContext.putImageData(imageData, 0, 0);

            resultCanvasContext.globalAlpha = defaults.transparency;

            if (SafariUtility.isSafari()) {
                SafariUtility.setCanvas(maskCanvasElement);
                SafariUtility.gBlur(defaults.safariBlur);
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

            // Draw filtered hair on top of original video
            resultCanvasContext.drawImage(
                maskCanvasElement,
                0, 0, width, height,
                0, 0, width, height
            );

            resultCanvasContext.globalAlpha = 1.0;
            resultCanvasContext.filter = 'none';
        }
    };
})();

export default HairColorEffect;