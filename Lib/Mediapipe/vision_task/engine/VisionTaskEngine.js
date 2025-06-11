// Detectors
import BrowsDetector from '../detector/BrowsDetector.js';
import EyesDetector from '../detector/EyesDetector.js';
import LipsDetector from '../detector/LipsDetector.js';
import JawDetector from '../detector/JawDetector.js';
import FaceDetector from "../detector/FaceDetector.js";

// Makeup effects
import LipstickEffect from '../../../../Effect/Makeup/Lipstick.js';
import LipstickMatteEffect from '../../../../Effect/Makeup/LipstickMatte.js';
import BrowsColorEffect from '../../../../Effect/Makeup/BrowsColor.js';
import EyelinerEffect from '../../../../Effect/Makeup/Eyeliner.js';
import LipLinerEffect from "../../../../Effect/Makeup/LipLiner.js";
import LipGlossEffect from "../../../../Effect/Makeup/LipGloss.js";
import LipstickShimmerEffect from "../../../../Effect/Makeup/LipstickShimmer.js";
import KajalEffect from "../../../../Effect/Makeup/Kajal.js";
import MascaraEffect from "../../../../Effect/Makeup/Mascara.js";
import HairColorEffect from "../../../../Effect/Makeup/HairColor.js";
import FoundationSatinEffect from "../../../../Effect/Makeup/FoundationSatin.js";
import FoundationMatteEffect from "../../../../Effect/Makeup/FoundationMatte.js";
import ConcealerEffect from "../../../../Effect/Makeup/Concealer.js";
import ContourEffect from "../../../../Effect/Makeup/Contour.js";
import EyeShadowSatin from "../../../../Effect/Makeup/EyeShadowSatin.js";
import EyeShadowMatte from "../../../../Effect/Makeup/EyeShadowMatte.js";
import EyeShadowShimmer from "../../../../Effect/Makeup/EyeShadowShimmer.js";

// Accessories effects
import EyeGlassesEffect from '../../../../Effect/Accessories/EyeGlassesEffect.js';

// Constants Area
import * as Constants from '../../../../Constants/EffectConstants.js';

/**
 * Processor of VisionTask engine
 * @type {{processFaceImage: (function(*, *, *): Promise<boolean>), processHairImage: (function(*, *, *): Promise<boolean>)}}
 */
const VisionTaskEngine = (function () {

        const RUNNING_MODE_VIDEO = "VIDEO";
        const RUNNING_MODE_IMAGE = "IMAGE";

        const RESULT_HAIR_INDEX = 1;

        var visionTask = null;

        var faceLandmarkerSegmenter = null;
        var faceLandmarkerClass = null;

        var imageSegmenter = null;
        var imageSegmenterClass = null;

        var visionTaskInitializationPromise = null; // Store the promise for initialization
        var faceLandmarkerSegmenterInitializationPromise = null; // Store the promise for initialization
        var imageSegmenterInitializationPromise = null; // Store the promise for initialization

        var currentModeImageSegmenter = null;
        var currentModeFaceLandmarker = null;

        /**
         * Initialize vision task library here
         */
        function initialize() {
            if (visionTaskInitializationPromise) {
                return visionTaskInitializationPromise; // Return existing promise if initialization is already in progress
            }

            visionTaskInitializationPromise = new Promise((resolve, reject) => {
                Promise.all([
                    import('../core/vision_bundle.js'),
                ])
                    .then(async ([vision_bundle]) => {
                        const {
                            DrawingUtils,
                            FaceLandmarker,
                            ImageSegmenter,
                            SegmentationMask,
                            FilesetResolver
                        } = vision_bundle;

                        visionTask = await FilesetResolver.forVisionTasks(
                            `/mirror/Lib/Mediapipe/vision_task/core/wasm/` // TODO set correct path
                        );
                        faceLandmarkerClass = FaceLandmarker;
                        imageSegmenterClass = ImageSegmenter;
                        resolve(); // Resolve the promise once initialization is complete
                    })
                    .catch(error => {
                        reject(error); // Reject the promise if initialization fails
                    });
            });

            return visionTaskInitializationPromise;
        }

        /**
         * Load segmenter to detect face landmarks
         * @returns {Promise<*>}
         */
        async function loadFaceLandmarkerSegmenter(mode) {

            if (visionTask == undefined || visionTask == null) {
                await initialize();
            }

            if (faceLandmarkerSegmenterInitializationPromise && currentModeFaceLandmarker === mode) {
                return faceLandmarkerSegmenterInitializationPromise; // Return existing promise if initialization is already in progress
            }

            faceLandmarkerSegmenterInitializationPromise = new Promise((resolve, reject) => {
                Promise.all([])
                    .then(async ([]) => {
                        faceLandmarkerSegmenter = await faceLandmarkerClass.createFromOptions(visionTask, {
                            baseOptions: {
                                modelAssetPath: `/mirror/Lib/Mediapipe/vision_task/model/face_landmarker.task`, // TODO set correct path,
                                delegate: "CPU"
                            },
                            numFaces: 1
                        });
                        currentModeFaceLandmarker = mode;
                        await faceLandmarkerSegmenter.setOptions({runningMode: mode});
                        resolve(); // Resolve the promise once initialization is complete
                    })
                    .catch(error => {
                        reject(error); // Reject the promise if initialization fails
                    });
            });

            return faceLandmarkerSegmenterInitializationPromise;
        }

        /**
         * Load Image segmenter
         * @returns {Promise<*>}
         */
        async function loadImageSegmenter(mode) {

            if (visionTask == undefined || visionTask == null) {
                await initialize();
            }

            if (imageSegmenterInitializationPromise && currentModeImageSegmenter === mode) {
                return imageSegmenterInitializationPromise; // Return existing promise if initialization is already in progress
            }

            imageSegmenterInitializationPromise = new Promise((resolve, reject) => {
                Promise.all([])
                    .then(async ([]) => {
                        imageSegmenter = await imageSegmenterClass.createFromOptions(visionTask, { // TODO load on apply effect
                            baseOptions: {
                                modelAssetPath: `/mirror/Lib/Mediapipe/vision_task/model/selfie_multiclass_256x256.tflite`, // TODO set correct path,
                                delegate: "GPU"
                            },
                            outputCategoryMask: false,
                            outputConfidenceMasks: true,
                        });
                        await imageSegmenter.setOptions({runningMode: mode});
                        currentModeImageSegmenter = mode;
                        resolve(); // Resolve the promise once initialization is complete
                    })
                    .catch(error => {
                        reject(error); // Reject the promise if initialization fails
                    });
            });

            return imageSegmenterInitializationPromise;
        }

        /**
         * Apply effect by a given result landmarks and effect object
         * @param resultCanvasHTMLObject
         * @param landmarks
         * @param effectObject
         */
        function applyEffect(resultCanvasHTMLObject, landmarks, effectObject) {
            let detectionData = null;

            switch (effectObject.effect) {
                case Constants.EFFECT_BROWS_COLOR:
                    detectionData = BrowsDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYEBROW,
                        faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYEBROW
                    );
                    BrowsColorEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_LIPSTICK:
                    detectionData = LipsDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_LIPS
                    );
                    LipstickEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_LIPLINER:
                    detectionData = LipsDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_LIPS
                    );
                    LipLinerEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_LIP_GLOSS:
                    detectionData = LipsDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_LIPS
                    );
                    LipGlossEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_LIPSTICK_SHIMMER:
                    detectionData = LipsDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_LIPS
                    );
                    LipstickShimmerEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_MATTE_LIPSTICK:
                    detectionData = LipsDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_LIPS
                    );
                    LipstickMatteEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYELINER:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_TESSELATION,
                        faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE,
                        faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                    );
                    EyelinerEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYESHADOW_SATIN:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_TESSELATION,
                        faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE,
                        faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                    );
                    EyeShadowSatin.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYESHADOW_MATTE:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_TESSELATION,
                        faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE,
                        faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                    );
                    EyeShadowMatte.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYESHADOW_SHIMMER:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_TESSELATION,
                        faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE,
                        faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                    );
                    EyeShadowShimmer.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_KAJAL:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_TESSELATION,
                        faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE,
                        faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                    );
                    KajalEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_MASCARA:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_TESSELATION,
                        faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE,
                        faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                    );
                    MascaraEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYEGLASSES:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_TESSELATION,
                        faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE,
                        faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                    );
                    let jawData = JawDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_FACE_OVAL
                    );
                    EyeGlassesEffect.apply(resultCanvasHTMLObject, detectionData, jawData, effectObject);
                    break;

                // case Constants.EFFECT_HAIR_COLOR: // TODO create a constant
                //     HairColorEffect.apply(resultCanvasHTMLObject, landmarks, effectObject);
                //     break;

                case Constants.EFFECT_FOUNDATION_SATIN:
                    detectionData = Object.assign(
                        EyesDetector.detect(
                            resultCanvasHTMLObject, landmarks, faceLandmarkerClass.FACE_LANDMARKS_TESSELATION, faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE, faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                        ),
                        FaceDetector.detect(resultCanvasHTMLObject, landmarks, faceLandmarkerClass.FACE_LANDMARKS_FACE_OVAL),
                        BrowsDetector.detect(
                            resultCanvasHTMLObject, landmarks, faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYEBROW, faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYEBROW
                        ),
                        LipsDetector.detect(resultCanvasHTMLObject, landmarks, faceLandmarkerClass.FACE_LANDMARKS_LIPS)

                    );
                    FoundationSatinEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_FOUNDATION_MATTE:
                    detectionData = Object.assign(
                        EyesDetector.detect(
                            resultCanvasHTMLObject, landmarks, faceLandmarkerClass.FACE_LANDMARKS_TESSELATION, faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE, faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                        ),
                        FaceDetector.detect(resultCanvasHTMLObject, landmarks, faceLandmarkerClass.FACE_LANDMARKS_FACE_OVAL),
                        BrowsDetector.detect(
                            resultCanvasHTMLObject, landmarks, faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYEBROW, faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYEBROW
                        ),
                        LipsDetector.detect(resultCanvasHTMLObject, landmarks, faceLandmarkerClass.FACE_LANDMARKS_LIPS)

                    );
                    FoundationMatteEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_CONTOUR:
                    detectionData = FaceDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_FACE_OVAL
                    );
                    ContourEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_CONCEALER:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        faceLandmarkerClass.FACE_LANDMARKS_TESSELATION,
                        faceLandmarkerClass.FACE_LANDMARKS_RIGHT_EYE,
                        faceLandmarkerClass.FACE_LANDMARKS_LEFT_EYE
                    );

                    ConcealerEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                default:
                    throw new Error('Unknown effect type: ' + effectObject.effect);
            }
        }

        return { // Public Area //TODO: upd library when will be available TODO play with effect apply time

            processHairVideo: async function (sourceVideoElementHTMLObject, resultCanvasHTMLObject, effectObject) {
                if (effectObject.effect !== Constants.EFFECT_HAIR_COLOR) {
                    throw new Error("Hair effect supported only by this segmenter.");
                }

                if (imageSegmenter == undefined || imageSegmenter == null || currentModeImageSegmenter !== RUNNING_MODE_VIDEO) {
                    await loadImageSegmenter(RUNNING_MODE_VIDEO);
                }

                let landmarksDetected = false;
                let lastVideoTime = performance.now();
                let resultCanvasContext = resultCanvasHTMLObject.getContext('2d');


                // async function test(result) {
                //     resultCanvasContext.clearRect(
                //         0, 0, sourceVideoElementHTMLObject.clientWidth, sourceVideoElementHTMLObject.clientHeight
                //     );
                //     resultCanvasContext.drawImage(
                //         sourceVideoElementHTMLObject, 0, 0, sourceVideoElementHTMLObject.clientWidth, sourceVideoElementHTMLObject.clientHeight
                //     );
                //
                //     let landmarks = result.confidenceMasks[RESULT_HAIR_INDEX];
                //
                //     if (landmarks) {
                //         await applyEffect(resultCanvasHTMLObject, landmarks.getAsFloat32Array(), effectObject);
                //         landmarksDetected = true;
                //     } else {
                //         landmarksDetected = false;
                //     }
                // }
                // resultCanvasContext.clearRect(
                //     0, 0, sourceVideoElementHTMLObject.clientWidth, sourceVideoElementHTMLObject.clientHeight
                // );
                // resultCanvasContext.drawImage(
                //     sourceVideoElementHTMLObject, 0, 0, sourceVideoElementHTMLObject.clientWidth, sourceVideoElementHTMLObject.clientHeight
                // );

                let results = await imageSegmenter.segmentForVideo(
                    sourceVideoElementHTMLObject,
                    lastVideoTime,
                    // test
                    // (result) => test(result)

                );

                if (results.confidenceMasks[RESULT_HAIR_INDEX]) {
                    await applyEffect(resultCanvasHTMLObject, results.confidenceMasks[RESULT_HAIR_INDEX].getAsFloat32Array(), effectObject);
                    landmarksDetected = true;
                } else {
                    landmarksDetected = false;
                }

                // await imageSegmenter.segmentForVideo(
                //     sourceVideoElementHTMLObject,
                //     lastVideoTime,
                //     (result) => test(result.confidenceMasks[RESULT_HAIR_INDEX].getAsFloat32Array())
                // );


                return landmarksDetected;
            },

            /**
             * Process video with requested effect using face segmenter
             *
             * Where:
             *  sourceVideoElementHTMLObject - <video> html object
             *  resultCanvasHTMLObject - canvas where to show the resulting output
             *  effectObject - object with effect settings (see FaceMesh documentation to get more info)
             *
             * @param sourceVideoElementHTMLObject
             * @param resultCanvasHTMLObject
             * @param effectObject
             * @returns {Promise<boolean>}
             */
            processFaceVideo: async function (sourceVideoElementHTMLObject, resultCanvasHTMLObject, effectObject) {
                if (effectObject.effect === Constants.EFFECT_HAIR_COLOR) {
                    throw new Error("Hair effect is not supported by this segmenter.");
                }

                if (faceLandmarkerSegmenter == undefined || faceLandmarkerSegmenter == null || currentModeFaceLandmarker !== RUNNING_MODE_VIDEO) {
                    await loadFaceLandmarkerSegmenter(RUNNING_MODE_VIDEO);
                }

                let landmarkDetected = false;
                let lastVideoTime = performance.now();
                let resultCanvasContext = resultCanvasHTMLObject.getContext('2d');

                const results = await faceLandmarkerSegmenter.detectForVideo(sourceVideoElementHTMLObject, lastVideoTime);

                resultCanvasContext.clearRect(
                    0, 0, sourceVideoElementHTMLObject.clientWidth, sourceVideoElementHTMLObject.clientHeight
                );
                resultCanvasContext.drawImage(
                    sourceVideoElementHTMLObject, 0, 0, sourceVideoElementHTMLObject.clientWidth, sourceVideoElementHTMLObject.clientHeight
                );

                if (results.faceLandmarks[0]) {
                    let landmarks = results.faceLandmarks[0];
                    await applyEffect(resultCanvasHTMLObject, landmarks, effectObject);
                    landmarkDetected = true
                } else {
                    landmarkDetected = false;
                }

                return landmarkDetected;
            },

            /**
             * Process image with requested effect using face segmenter
             *
             * Where:
             *  sourceImageElementHTMLObject - <img> html object
             *  resultCanvasHTMLObject - canvas where to show the resulting output
             *  effectObject - object with effect settings (see FaceMesh documentation to get more info)
             *
             * @param sourceImageElementHTMLObject
             * @param resultCanvasHTMLObject
             * @param effectObject
             * @returns {Promise<boolean>}
             */
            processFaceImage: async function (sourceImageElementHTMLObject, resultCanvasHTMLObject, effectObject) {

                if (effectObject.effect === Constants.EFFECT_HAIR_COLOR) {
                    throw new Error("Hair effect is not supported by this segmenter.");
                }

                if (faceLandmarkerSegmenter == undefined || faceLandmarkerSegmenter == null || currentModeFaceLandmarker !== RUNNING_MODE_IMAGE) {
                    await loadFaceLandmarkerSegmenter(RUNNING_MODE_IMAGE);
                }

                let landmarksDetected = false;
                let resultCanvasContext = resultCanvasHTMLObject.getContext('2d');

                // clean result canvas and display captured image
                resultCanvasContext.clearRect(
                    0, 0, sourceImageElementHTMLObject.naturalWidth, sourceImageElementHTMLObject.naturalHeight
                );
                resultCanvasContext.drawImage(
                    sourceImageElementHTMLObject, 0, 0, resultCanvasHTMLObject.width, resultCanvasHTMLObject.height
                );

                const results = faceLandmarkerSegmenter.detect(sourceImageElementHTMLObject);

                if (results.faceLandmarks[0]) {
                    let landmarks = results.faceLandmarks[0];
                    applyEffect(resultCanvasHTMLObject, landmarks, effectObject);
                    landmarksDetected = true;
                }

                return landmarksDetected;
            },

            /**
             * WARNING! don't use this effect on production.
             * Hair is not supported on all browsers yet!
             *
             * Process image with hair effect using image segmenter
             *
             * Where:
             *  sourceImageElementHTMLObject - <img> html object
             *  resultCanvasHTMLObject - canvas where to show the resulting output
             *  effectObject - object with effect settings (see FaceMesh documentation to get more info)
             *
             * @param sourceImageElementHTMLObject
             * @param resultCanvasHTMLObject
             * @param effectObject
             * @returns {Promise<boolean>}
             */
            processHairImage: async function (sourceImageElementHTMLObject, resultCanvasHTMLObject, effectObject) {

                if (effectObject.effect !== Constants.EFFECT_HAIR_COLOR) {
                    throw new Error("Hair effect is not supported by this segmenter.");
                }

                if (imageSegmenter == undefined || imageSegmenter == null || currentModeImageSegmenter !== RUNNING_MODE_IMAGE) {
                    await loadImageSegmenter(RUNNING_MODE_IMAGE);
                }

                let landmarksDetected = false;
                let resultCanvasContext = resultCanvasHTMLObject.getContext('2d');

                // clean result canvas and display captured image
                resultCanvasContext.clearRect(
                    0, 0, sourceImageElementHTMLObject.naturalWidth, sourceImageElementHTMLObject.naturalHeight
                );
                resultCanvasContext.drawImage(
                    sourceImageElementHTMLObject, 0, 0, resultCanvasHTMLObject.width, resultCanvasHTMLObject.height
                );

                const results = imageSegmenter.segment(sourceImageElementHTMLObject);

                if (results.confidenceMasks[RESULT_HAIR_INDEX]) {
                    applyEffect(resultCanvasHTMLObject, results.confidenceMasks[RESULT_HAIR_INDEX].getAsFloat32Array(), effectObject);
                    landmarksDetected = true;
                } else {
                    landmarksDetected = false;
                }

                return landmarksDetected;
            },
        };
    }
)();

export default VisionTaskEngine;