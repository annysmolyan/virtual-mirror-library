import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import DrawUtility from "../../Utility/DrawUtility.js";

/**
 * Apply brows color effect
 * @type {{apply: BrowsColorEffect.apply}}
 */
const BrowsColorEffect = (function () {

    // Private Area
    const defaults = {
        transparency: 0.33,
        blur: 3,
        safariBlur: 1, //hardcoded value don't change,
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
         * browsData represents the following object:
         * {
         *     "rightBrowContourCoordinates" : [{x: 000.22, y: 555}, .....],
         *     "leftBrowContourCoordinates": [{x: 000.22, y: 555}, .....];
         * }
         *
         * @param resultCanvasElement
         * @param browsData
         * @param effectSettings
         */
        apply: function (resultCanvasElement, browsData, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid brows effect settings object.');
            }

            initMaskCanvas();

            let resultCanvasContext = resultCanvasElement.getContext('2d');
            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            // uncomment if need to have supernatural effect and comment 2 lines below
            // let averageBrowsColor = ColorUtility.getAveragePixelsRgbColor(
            //     browsData.leftBrowContourCoordinates.concat(browsData.rightBrowContourCoordinates),
            //     resultCanvasContext
            // );
            // let appliedColor = ColorUtility.getAverageColor(averageBrowsColor, rgbAppliedColor);

            let rgbAppliedColor = ColorUtility.getRgbFromHex(effectSettings.value);
            let appliedColor = rgbAppliedColor; // to have more bright effect

            maskCanvasContext.clearRect(0, 0, width, height);

            // Draw and fill brows contour
            DrawUtility.drawContour(
                maskCanvasContext,
                browsData.rightBrowContourCoordinates,
                {fillStyle: `rgb(${appliedColor.r}, ${appliedColor.g}, ${appliedColor.b})`}
            );
            DrawUtility.drawContour(
                maskCanvasContext,
                browsData.leftBrowContourCoordinates,
                {fillStyle: `rgb(${appliedColor.r}, ${appliedColor.g}, ${appliedColor.b})`}
            );

            resultCanvasContext.globalAlpha = defaults.transparency;

            if (SafariUtility.isSafari()) {
                SafariUtility.setCanvas(maskCanvasElement);
                SafariUtility.gBlur(defaults.safariBlur);
            } else {
                resultCanvasContext.filter = `blur(${defaults.blur}px)`;
            }

            resultCanvasContext.drawImage(maskCanvasElement, 0, 0, width, height);

            // Reset filters and restore global transparency
            resultCanvasContext.filter = 'none';
            resultCanvasContext.globalAlpha = 1.0;
        }
    };
})();

export default BrowsColorEffect;
