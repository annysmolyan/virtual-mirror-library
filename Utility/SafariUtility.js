const SafariUtility = (function () {

    // Private Area
    var canvas = null;
    var ctx = null;
    var canvas_off = null;
    var ctx_off = null;

    return { // Public Area
        /**
         * @returns {boolean}
         */
        isSafari: function () {
            return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        },

        /**
         * Set canvas before working
         * @param canvasObject
         */
        setCanvas(canvasObject){
            canvas = canvasObject;
            ctx = canvasObject.getContext('2d');
            let w = canvasObject.width;
            let h = canvasObject.height;
            canvas_off = document.createElement("canvas");
            ctx_off = canvas_off.getContext("2d");
            canvas_off.width = w;
            canvas_off.height = h;
            ctx_off.drawImage(canvasObject, 0, 0);
        },

        /**
         * Recover canvas
         */
        recoverCanvas(){
            let w = canvas_off.width;
            let h = canvas_off.height;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(this.canvas_off,0,0);
        },

        /**
         * Gassuan blur
         * @param blur
         */
        gBlur(blur) {
            let sum = 0;
            let delta = 5;
            let alpha_left = 1 / (2 * Math.PI * delta * delta);
            let step = blur < 3 ? 1 : 2;
            for (let y = -blur; y <= blur; y += step) {
                for (let x = -blur; x <= blur; x += step) {
                    let weight = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta));
                    sum += weight;
                }
            }
            let count = 0;
            for (let y = -blur; y <= blur; y += step) {
                for (let x = -blur; x <= blur; x += step) {
                    count++;
                    ctx.globalAlpha = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta)) / sum * blur;
                    ctx.drawImage(canvas,x,y);
                }
            }
            ctx.globalAlpha = 1;
        },

        /**
         * @param distance
         */
        mBlur(distance){
            distance = distance<0?0:distance;
            let w = canvas.width;
            let h = canvas.height;
            canvas.width = w;
            canvas.height = h;
            ctx.clearRect(0,0,w,h);

            for(let n=0;n<5;n+=0.1){
                ctx.globalAlpha = 1/(2*n+1);
                let scale = distance/5*n;
                ctx.transform(1+scale,0,0,1+scale,0,0);
                ctx.drawImage(canvas_off, 0, 0);
            }
            ctx.globalAlpha = 1;
            if(distance<0.01){
                window.requestAnimationFrame(()=>{
                    this.mBlur(distance+0.0005);
                });
            }
        }
    };
})();

export default SafariUtility;
