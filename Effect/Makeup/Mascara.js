import ColorUtility from "../../Utility/ColorUtility.js";
import CoordinatesUtility from "../../Utility/CoordinatesUtility.js";

/**
 * Apply mascara effect
 * @type {{apply: MascaraEffect.apply}}
 */
const MascaraEffect = (function () {

    let maskCanvasElement = null; // will be used to make effect "behind the scene"
    let maskCanvasContext = null; // keep 2D rendering context for the canvas
    let lashesTopImage = null; // keep image object loaded once to save performance
    let lashesBottomImage = null; // keep image object loaded once to save performance

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
     * Init image for top lashes
     * @param src
     * @returns {Promise<unknown>}
     */
    function initTopLashesImage(src) {
        return new Promise((resolve, reject) => {
            lashesTopImage = new Image();
            lashesTopImage.onload = () => resolve(lashesTopImage);
            lashesTopImage.onerror = reject;
            lashesTopImage.src = src;
        });
    }

    /**
     * Init image for bottom lashes
     * @param src
     * @returns {Promise<unknown>}
     */
    function initBottomLashesImage(src) {
        return new Promise((resolve, reject) => {
            lashesBottomImage = new Image();
            lashesBottomImage.onload = () => resolve(lashesBottomImage);
            lashesBottomImage.onerror = reject;
            lashesBottomImage.src = src;
        });
    }

    /**
     * Change lashes image
     * @param lashesImage
     * @param hexColor
     * @returns {HTMLImageElement}
     */
    function changeLashesColor(lashesImage, hexColor) {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let rgbDesiredColor = ColorUtility.getRgbFromHex(hexColor);

        // Set canvas size to match image size
        canvas.width = lashesImage.width;
        canvas.height = lashesImage.height;

        ctx.drawImage(lashesImage, 0, 0); // Draw the original image onto the canvas

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;

        // Iterate over each pixel
        for (let i = 0; i < data.length; i += 4) {
            // Check if the pixel is not transparent
            if (data[i + 3] !== 0) {
                // Replace the color of the pixel with the new color
                data[i] = rgbDesiredColor.r;     // Red channel
                data[i + 1] = rgbDesiredColor.g; // Green channel
                data[i + 2] = rgbDesiredColor.b; // Blue channel
                // Alpha channel remains unchanged
            }
        }

        // Put the modified image data back onto the canvas
        ctx.putImageData(imageData, 0, 0);

        // Create a new image element with the modified image data
        let newImage = new Image();
        newImage.src = canvas.toDataURL();

        return newImage;
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
                throw new Error('Invalid mascara effect settings object.');
            }

            initMaskCanvas();

            if (null == lashesTopImage || undefined == lashesTopImage) {
                await initTopLashesImage("/mirror/Effect/Makeup/assets/lashes_right.png");//TODO
            }

            if (null == lashesBottomImage || undefined == lashesBottomImage) {
                await initBottomLashesImage("/mirror/Effect/Makeup/assets/lashes_right-bottom.png");//TODO
            }

            let resultCanvasContext = resultCanvasElement.getContext('2d');
            let width = resultCanvasElement.width;
            let height = resultCanvasElement.height;

            // resize masked canvas aligned with source canvas
            maskCanvasElement.width = width;
            maskCanvasElement.height = height;

            if (lashesTopImage.width == 0 || lashesBottomImage.width == 0) {
                return;
            }

            //apply lashes color
            lashesTopImage = await changeLashesColor(lashesTopImage, effectSettings.value);
            lashesBottomImage = await changeLashesColor(lashesBottomImage, effectSettings.value);

            let angle = Math.atan2(eyesData.leftEyeCenter.y - eyesData.rightEyeCenter.y, eyesData.leftEyeCenter.x - eyesData.rightEyeCenter.x);
            let lashesWidth = CoordinatesUtility.getDistanceBetweenPoints(eyesData.rightEyeLineTop[7], eyesData.rightEyeLineTop[0]) * 1.8;
            let originalAspectRatio = lashesTopImage.width / lashesTopImage.height;
            let lashesHeight = lashesWidth / originalAspectRatio;

            // paste mascara for right eye: TOP lashes
            maskCanvasContext.translate(eyesData.rightEyeLineTop[7].x , eyesData.rightEyeLineTop[7].y);
            maskCanvasContext.rotate(angle);
            maskCanvasContext.drawImage(lashesTopImage, -lashesWidth / 3, -lashesHeight / 1.2, lashesWidth, lashesHeight);

            maskCanvasContext.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation to identity matrix

            // paste mascara for right eye: BOTTOM lashes
            maskCanvasContext.translate(eyesData.rightEyeLineTop[7].x , eyesData.rightEyeLineTop[7].y);
            maskCanvasContext.rotate(angle);
            maskCanvasContext.drawImage(lashesBottomImage, -lashesWidth / 4, -lashesHeight / 3, lashesWidth, lashesHeight);


            maskCanvasContext.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation to identity matrix


            // paste mascara for left eye: TOP lashes
            maskCanvasContext.translate(eyesData.leftEyeLineTop[7].x , eyesData.leftEyeLineTop[7].y);
            maskCanvasContext.scale(-1, 1);
            maskCanvasContext.rotate(-angle)
            maskCanvasContext.drawImage(lashesTopImage, -lashesWidth / 2.5, -lashesHeight / 1.2, lashesWidth, lashesHeight);

            maskCanvasContext.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation to identity matrix

            // paste mascara for left eye: BOTTOM lashes
            maskCanvasContext.translate(eyesData.leftEyeLineTop[7].x , eyesData.leftEyeLineTop[7].y);
            maskCanvasContext.scale(-1, 1);
            maskCanvasContext.rotate(-angle)
            maskCanvasContext.drawImage(lashesBottomImage, -lashesWidth / 4, -lashesHeight / 3, lashesWidth, lashesHeight);

            maskCanvasContext.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation to identity matrix

            //display the result
            resultCanvasContext.drawImage(maskCanvasElement, 0, 0, width, height);
        }
    };
})();

export default MascaraEffect;