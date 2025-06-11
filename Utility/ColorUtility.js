const ColorUtility= (function () {
    return { // Public Area

        /**
         * Check if the "color" is a valid hexadecimal color code
         * @param colorValue
         * @returns {boolean}
         */
        isHexColor: function (colorValue) {
            const colorRegex = /^#[0-9A-Fa-f]{6}$/;
            return colorRegex.test(colorValue);
        },

        /**
         * Mix color in natural way
         * where factor is domination of desired color from 0 to 1
         * @param desiredColor
         * @param originalColor
         * @param factor
         * @param transparency
         * @returns {{a: number, r: *, b: *, g: *}}
         */
        interpolateColors: function (desiredColor, originalColor, factor, transparency) {
            let p = factor / 100;
            return {
                r: (desiredColor.r - originalColor.r) * p + originalColor.r,
                g: (desiredColor.g - originalColor.g) * p + originalColor.g,
                b: (desiredColor.b - originalColor.b) * p + originalColor.b,
                a: Math.round(transparency * 255)
            };
        },

        /**
         * Make color matte
         * @param {{a, r: number, b: number, g: number}} color
         * @returns {{a, r: number, b: number, g: number}}
         */
        toMatteColor: function (color) {
            // Adjust the saturation and brightness to create a matte effect
            const saturation = 0.9; // Adjust the value as needed
            const brightness = 0.9; // Adjust the value as needed

            const hslColor = this.rgbToHsl(color.r, color.g, color.b);

            // Apply the saturation and brightness modifications
            const modifiedHslColor = {
                h: hslColor.h,
                s: hslColor.s * saturation,
                l: hslColor.l * brightness,
            };

            // Convert the modified HSL color back to RGB color space
            const modifiedRgbColor = this.hslToRgb(modifiedHslColor.h, modifiedHslColor.s, modifiedHslColor.l);

            return {
                r: modifiedRgbColor.r,
                g: modifiedRgbColor.g,
                b: modifiedRgbColor.b,
                a: color.a,
            };
        },

        /**
         * Warning! areaColor and desiredColor must represent an object: {r: number, b: number, g: number}
         * Return average color between applied area (e.g. lips) and desired color
         * Need it to get more natural effect
         *
         * @param {{a, r: number, b: number, g: number}} areaColor
         * @param {{a, r: number, b: number, g: number}} desiredColor
         * @returns {{r: number, b: number, g: number}}
         */
        getAverageColor: function (areaColor, desiredColor) {
            return {
                r: Math.round((areaColor.r + desiredColor.r) / 2),
                g: Math.round((areaColor.g + desiredColor.g) / 2),
                b: Math.round((areaColor.b + desiredColor.b) / 2)
            };
        },

        /**
         * saturationIncrease can be between 0 and 1
         * @param rgbColor
         * @param saturation
         * @returns {*}
         */
        increaseSaturation: function (rgbColor, saturation) {
            if (saturation < 0 || saturation > 1) {
                throw new Error('Invalid saturation value.');
            }

            let hslColor = this.rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b);

            // Increase the saturation
            hslColor.s += saturation;

            // Ensure saturation is within [0, 1] range
            hslColor.s = Math.max(0, Math.min(1, hslColor.s));

            // Convert HSL back to RGB
            return this.hslToRgb(hslColor.h, hslColor.s, hslColor.l);
        },

        /**
         * Convert hex color to RGB object
         *
         * @param hex
         * @returns {{r: number, b: number, g: number}}
         */
        getRgbFromHex: function (hex) {
            hex = hex.replace('#', '');

            let decimal = parseInt(hex, 16); // Convert hexadecimal to decimal
            let r = (decimal >> 16) & 255; // Extract red component from decimal value
            let g = (decimal >> 8) & 255; // Extract green component from decimal value
            let b = decimal & 255; // Extract blue component from decimal value

            //don't allow 0 value, it won't be applied in mask
            r = r + 1;
            g = g + 1;
            b = b + 1;

            return {r, g, b};
        },

        /**
         * @param r
         * @param g
         * @param b
         * @returns {{s: number, h: number, l: number}}
         */
        rgbToHsl: function (r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4;
                        break;
                }
                h /= 6;
            }

            return {
                h: h,
                s: s,
                l: l
            };
        },

        /**
         * @param h
         * @param s
         * @param l
         * @returns {{r: number, b: number, g: number}}
         */
        hslToRgb: function (h, s, l) {
            let r, g, b;

            if (s === 0) {
                r = g = b = l; // achromatic
            } else {
                function hue2rgb(p, q, t) {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                }

                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;

                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }

            return {
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255),
            };
        },

        /**
         * Return average color of provided pixels from source canvas image
         * Need to know this color to avoid not natural applied effect
         *
         * @param coordinates
         * @param canvasContext
         * @returns {{r: number, b: number, g: number}}
         */
        getAveragePixelsRgbColor: function (coordinates, canvasContext) {
            let averageColor = {r: 0, g: 0, b: 0};
            let width = 1; // width of the area to capture (in this case, 1 pixel)
            let height = 1; // height of the area to capture (in this case, 1 pixel)

            for (var i = 0; i < coordinates.length; i++) {

                // Capture the image data of the current pixel area
                let imageData = canvasContext.getImageData(
                    coordinates[i].x,
                    coordinates[i].y,
                    width,
                    height
                );

                averageColor.r += imageData.data[0]; // Red component of the pixel color
                averageColor.g += imageData.data[1]; // Green component of the pixel color
                averageColor.b += imageData.data[2]; // Blue component of the pixel color
            }

            // Divide the total color components by the number of areas to get the average color
            // and round the average color components to integers
            let numAreas = coordinates.length;

            averageColor.r = Math.round(averageColor.r / numAreas);
            averageColor.g = Math.round(averageColor.g / numAreas);
            averageColor.b = Math.round(averageColor.b / numAreas);

            return averageColor;
        }
    };
})();

export default ColorUtility;
