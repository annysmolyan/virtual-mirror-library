import ColorUtility from "../../Utility/ColorUtility.js";
import SafariUtility from "../../Utility/SafariUtility.js";
import DrawUtility from "../../Utility/DrawUtility.js";

/**
 * Apply foundation matte color effect
 * @type {{apply: FoundationMatteEffect.apply}}
 */
const FoundationMatteEffect = (function () {

    // Private Area
    const defaults = {
        blur: 3,
        safariBlur: 1, //hardcoded value don't change
        transparency: 0.2
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
         * detectionData represents the following object:
         * {
         *  "rightPeakWing": [{x: 000.22, y: 555}, .....],
         *  "rightEyeLineBottom": [{x: 000.22, y: 555}, .....],
         *  "rightEyeLineTop": [{x: 000.22, y: 555}, .....],
         *  "leftPeakWing": [{x: 000.22, y: 555}, .....],
         *  "leftEyeLineBottom": [{x: 000.22, y: 555}, .....],
         *  "leftEyeLineTop": [{x: 000.22, y: 555}, .....],
         *  "leftEyeCenter": [{x: 000.22, y: 555}, .....],
         *  "rightEyeCenter": [{x: 000.22, y: 555}, .....],
         *  "faceOval": [{x: 000.22, y: 555}, .....],
         *  "rightBrowContourCoordinates" : [{x: 000.22, y: 555}, .....],
         *  "leftBrowContourCoordinates": [{x: 000.22, y: 555}, .....],
         *  "externalLipsContourCoordinates" : [{x: 000.22, y: 555}, .....],
         *  "internalLipsContourCoordinates": [{x: 000.22, y: 555}, .....],
         * }
         *
         * @param resultCanvasElement
         * @param detectionData
         * @param effectSettings
         */
        apply: function (resultCanvasElement, detectionData, effectSettings) {

            if (!isValidEffectSettings(effectSettings)) {
                throw new Error('Invalid foundation effect settings object.');
            }

            initMaskCanvas();

            let resultCanvasContext = resultCanvasElement.getContext('2d');
            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            let rgbDesiredColor = ColorUtility.getRgbFromHex(effectSettings.value);

            rgbDesiredColor = ColorUtility.toMatteColor(rgbDesiredColor);

            // prolong face top oval
            for (var i = 0; i < 36; i++) {
                if (i < 7 || (i >= 30 && i < 36)) {
                    detectionData.faceOvalCoordinates[i].y -= 30;
                }
            }

            // Draw and fill face contour
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.faceOvalCoordinates,
                {fillStyle: `rgb(${rgbDesiredColor.r}, ${rgbDesiredColor.g}, ${rgbDesiredColor.b})`}
            );

            // Cut out lips
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.externalLipsContourCoordinates,
                {fillStyle: 'white', globalCompositeOperation: 'destination-out'}
            );

            // Cut out brows
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.rightBrowContourCoordinates,
                {fillStyle: 'white', globalCompositeOperation: 'destination-out'}
            );
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.leftBrowContourCoordinates,
                {fillStyle: 'white', globalCompositeOperation: 'destination-out'}
            );


            // Cut out eyes
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.rightEyeCoordinates.slice(0,8).concat(detectionData.rightEyeCoordinates.slice(8,15).reverse()),
                {fillStyle: 'white', globalCompositeOperation: 'destination-out'}
            );
            DrawUtility.drawContour(
                maskCanvasContext,
                detectionData.leftEyeCoordinates.slice(0,8).reverse().concat(detectionData.leftEyeCoordinates.slice(8,15)),
                {fillStyle: 'white', globalCompositeOperation: 'destination-out'}
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

export default FoundationMatteEffect;
