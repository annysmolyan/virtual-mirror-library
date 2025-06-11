import FaceMeshEngine from './engine/FaceMeshEngine.js';

/**
 * Processor of FaceMesh engine
 * @type {{processVideo: ((function(*, *, *): Promise<boolean>)|*), processImage: (function(*, *, *): Promise<boolean>)}}
 */
const FaceMeshProcessor = (function () {

        let isAnimating = false;
        let intervalId = null;

        /**
         * Validate that given object is <img> element.
         * (can be get by document.getElementById("ID_STRING"))
         *
         * @param imageHtmlObject
         */
        function validateImageHtmlObject(imageHtmlObject) {
            if (imageHtmlObject.tagName.toLowerCase() !== 'img') {
                throw new Error("Can not process image. The given object doesn't represent img tag");
            }
        }

        /**
         * Validate that given object is <video> element.
         * (can be get by document.getElementById("ID_STRING"))
         *
         * @param videoHtmlObject
         */
        function validateVideoHtmlObject(videoHtmlObject) {
            if (videoHtmlObject.tagName.toLowerCase() !== 'video') {
                throw new Error("Can not process video. The given object doesn't represent video tag");
            }
        }

        /**
         * Validate that given object is <canvas> element.
         * (can be get by document.getElementById("ID_STRING"))
         *
         * @param canvasHtmlObject
         */
        function validateCanvasHtmlObject(canvasHtmlObject) {
            if (canvasHtmlObject.tagName.toLowerCase() !== 'canvas') {
                throw new Error("Can not process video. The given object doesn't represent canvas tag");
            }
        }

        /**
         * Process video with requested effect
         *
         * Where:
         *  sourceVideoHtmlObject - <video> html object
         *  resultCanvasHTMLObject - canvas where to show the resulting output
         *  effectObject - object with effect settings (see FaceMesh documentation to get more info)
         *
         * @param sourceVideoHtmlObject
         * @param resultCanvasHTMLObject
         * @param effectObject
         * @returns {Promise<boolean>}
         */
        async function processVideo (sourceVideoHtmlObject, resultCanvasHTMLObject, effectObject) {

            validateCanvasHtmlObject(resultCanvasHTMLObject);

            async function drawResults() {
                validateVideoHtmlObject(sourceVideoHtmlObject);

                let resultCanvasContext = resultCanvasHTMLObject.getContext('2d');
                let width = sourceVideoHtmlObject.clientWidth;
                let height = sourceVideoHtmlObject.clientHeight;

                // make result canvas the same size as source video
                resultCanvasHTMLObject.width = width;
                resultCanvasHTMLObject.height = height;

                resultCanvasContext.drawImage(sourceVideoHtmlObject, 0, 0, width, height);

                await FaceMeshEngine.process(
                    sourceVideoHtmlObject,
                    resultCanvasHTMLObject,
                    effectObject
                );
            }

            intervalId = setInterval(async () => {
                if (!isAnimating) {
                    isAnimating = true;
                    await drawResults();
                    isAnimating = false;
                }
            }, 10);
        }

        /**
         * Process image with a requested effect
         *
         * Where:
         *  SourceImageHtmlObject - <img> html object
         *  resultCanvasHTMLObject - canvas where to show the resulting output
         *  effectObject - object with effect settings (see FaceMesh documentation to get more info)
         *
         * @param sourceImageHtmlObject
         * @param resultCanvasHTMLObject
         * @param effectObject
         * @returns {Promise<boolean>}
         */
        async function processImage (sourceImageHtmlObject, resultCanvasHTMLObject, effectObject) {
            validateImageHtmlObject(sourceImageHtmlObject);
            validateCanvasHtmlObject(resultCanvasHTMLObject);

            // make result canvas the same size as source image
            resultCanvasHTMLObject.width = sourceImageHtmlObject.width;
            resultCanvasHTMLObject.height = sourceImageHtmlObject.height;

            await FaceMeshEngine.process(
                sourceImageHtmlObject,
                resultCanvasHTMLObject,
                effectObject
            );
        }

        return { // Public Area

            /**
             * Where processedElementHtmlObject can be either <img> or <video> html object
             * @param processedElementHtmlObject
             * @param resultCanvasHTMLObject
             * @param effectObject
             * @returns {Promise<void>}
             */
            process: async function(processedElementHtmlObject, resultCanvasHTMLObject, effectObject) {
                await this.terminate();

                if (processedElementHtmlObject.tagName.toLowerCase() === 'video') {
                    await processVideo(processedElementHtmlObject, resultCanvasHTMLObject, effectObject);
                } else if (processedElementHtmlObject.tagName.toLowerCase() === 'img') {
                    await processImage(processedElementHtmlObject, resultCanvasHTMLObject, effectObject);
                } else {
                    this.terminate();
                    throw new Error("Invalid source type. Can process img or video only");
                }
            },

            /**
             * Stop detection
             */
            terminate: function () {
                clearInterval(intervalId);
                isAnimating = false;
            }
        };
    }
)();

export default FaceMeshProcessor;
