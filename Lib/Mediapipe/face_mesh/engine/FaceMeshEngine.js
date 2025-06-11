// Detectors
import BrowsDetector from '../detector/BrowsDetector.js';
import EyesDetector from '../detector/EyesDetector.js';
import LipsDetector from '../detector/LipsDetector.js';
import JawDetector from '../detector/JawDetector.js';
import FaceDetector from '../detector/FaceDetector.js';

// Makeup effects
import LipstickEffect from '../../../../Effect/Makeup/Lipstick.js';
import LipstickMatteEffect from '../../../../Effect/Makeup/LipstickMatte.js';
import BrowsColorEffect from '../../../../Effect/Makeup/BrowsColor.js';
import EyelinerEffect from '../../../../Effect/Makeup/Eyeliner.js';
import LipLinerEffect from '../../../../Effect/Makeup/LipLiner.js';
import LipGlossEffect from '../../../../Effect/Makeup/LipGloss.js';
import LipstickShimmerEffect from "../../../../Effect/Makeup/LipstickShimmer.js";
import KajalEffect from "../../../../Effect/Makeup/Kajal.js";
import MascaraEffect from "../../../../Effect/Makeup/Mascara.js";
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
 * FaceMeshEngine
 * @type {{processVideo: ((function(*, *, *): Promise<void>)|*)}}
 */
const FaceMeshEngine = (function () {

        var faceMesh = null;
        var initializationPromise = null; // Store the promise for initialization
        var currentMode = null;

        /**
         * Initialize facemesh library here
         */
        function initialize() {
            if (initializationPromise) {
                return initializationPromise; // Return existing promise if initialization is already in progress
            }

            initializationPromise = new Promise((resolve, reject) => {
                Promise.all([
                    import('../core/camera_utils.js'),
                    import('../core/control_utils.js'),
                    import('../core/drawing_utils.js'),
                    import('../core/face-mesh.js'),
                ])
                    .then(async ([
                        camera_utils,
                        control_utils,
                        drawing_utils,
                        face_mesh,
                    ]) => {

                        faceMesh = await new FaceMesh({
                            locateFile: (file) => {
                                return `/mirror/Lib/Mediapipe/face_mesh/core/wasm/${file}`; //TODO correct the path of images
                            }
                        });

                        faceMesh.setOptions({
                            maxNumFaces: 1,
                            refineLandmarks: true,
                            minDetectionConfidence: 0.5,
                            minTrackingConfidence: 0.5
                        });

                        resolve(); // Resolve the promise once initialization is complete
                    })
                    .catch(error => {
                        reject(error); // Reject the promise if initialization fails
                    });
            });

            return initializationPromise;
        }

        /**
         * Apply effect by a given result landmarks and effect object
         * @param landmarks
         * @param effectObject
         * @param resultCanvasHTMLObject
         */
        function applyEffect(landmarks, effectObject, resultCanvasHTMLObject) {
            let detectionData = null;

            switch (effectObject.effect) {

                case Constants.EFFECT_BROWS_COLOR:
                    detectionData = BrowsDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_LEFT_EYEBROW,
                        FACEMESH_RIGHT_EYEBROW
                    );
                    BrowsColorEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_LIPSTICK:
                    detectionData = LipsDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_LIPS);
                    LipstickEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_LIPLINER:
                    detectionData = LipsDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_LIPS);
                    LipLinerEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_LIP_GLOSS:
                    detectionData = LipsDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_LIPS);
                    LipGlossEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_LIPSTICK_SHIMMER:
                    detectionData = LipsDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_LIPS);
                    LipstickShimmerEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_MATTE_LIPSTICK:
                    detectionData = LipsDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_LIPS);
                    LipstickMatteEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYELINER:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_TESSELATION,
                        FACEMESH_LEFT_EYE,
                        FACEMESH_RIGHT_EYE
                    );
                    EyelinerEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYESHADOW_SATIN:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_TESSELATION,
                        FACEMESH_LEFT_EYE,
                        FACEMESH_RIGHT_EYE
                    );
                    EyeShadowSatin.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYESHADOW_MATTE:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_TESSELATION,
                        FACEMESH_LEFT_EYE,
                        FACEMESH_RIGHT_EYE
                    );
                    EyeShadowMatte.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYESHADOW_SHIMMER:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_TESSELATION,
                        FACEMESH_LEFT_EYE,
                        FACEMESH_RIGHT_EYE
                    );
                    EyeShadowShimmer.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_KAJAL:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_TESSELATION,
                        FACEMESH_LEFT_EYE,
                        FACEMESH_RIGHT_EYE
                    );
                    KajalEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_MASCARA:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_TESSELATION,
                        FACEMESH_LEFT_EYE,
                        FACEMESH_RIGHT_EYE
                    );
                    MascaraEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_EYEGLASSES:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_TESSELATION,
                        FACEMESH_LEFT_EYE,
                        FACEMESH_RIGHT_EYE
                    );
                    let jawData = JawDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_FACE_OVAL
                    );
                    EyeGlassesEffect.apply(resultCanvasHTMLObject, detectionData, jawData, effectObject);
                    break;

                case Constants.EFFECT_FOUNDATION_SATIN:
                    detectionData = Object.assign(
                        EyesDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_TESSELATION, FACEMESH_LEFT_EYE, FACEMESH_RIGHT_EYE),
                        FaceDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_FACE_OVAL),
                        BrowsDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_LEFT_EYEBROW, FACEMESH_RIGHT_EYEBROW),
                        LipsDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_LIPS)
                    );

                    FoundationSatinEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_FOUNDATION_MATTE:
                    detectionData = Object.assign(
                        EyesDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_TESSELATION, FACEMESH_LEFT_EYE, FACEMESH_RIGHT_EYE),
                        FaceDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_FACE_OVAL),
                        BrowsDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_LEFT_EYEBROW, FACEMESH_RIGHT_EYEBROW),
                        LipsDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_LIPS)
                    );

                    FoundationMatteEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_CONCEALER:
                    detectionData = EyesDetector.detect(
                        resultCanvasHTMLObject,
                        landmarks,
                        FACEMESH_TESSELATION,
                        FACEMESH_LEFT_EYE,
                        FACEMESH_RIGHT_EYE
                    );

                    ConcealerEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                case Constants.EFFECT_CONTOUR:
                    detectionData = FaceDetector.detect(resultCanvasHTMLObject, landmarks, FACEMESH_FACE_OVAL);
                    ContourEffect.apply(resultCanvasHTMLObject, detectionData, effectObject);
                    break;

                default:
                    throw new Error('Unknown effect type: ' + effectObject.effect);
                    break;
            }
        }

        return { // Public Area

            /**
             * Process video or image with requested effect
             *
             * Where:
             *  processedElementHTMLObject - it can be either <img> html object or <video> html object
             *  resultCanvasHTMLObject - canvas where to show the resulting output
             *  effectObject - object with effect settings (see FaceMesh documentation to get more info)
             *
             * @param processedElementHTMLObject
             * @param resultCanvasHTMLObject
             * @param effectObject
             * @returns {Promise<boolean>}
             */
            process: async function (processedElementHTMLObject, resultCanvasHTMLObject, effectObject) {
                let landmarksDetected = false;

                if (faceMesh == undefined || faceMesh == null) {
                    await initialize();
                }

                if (currentMode !== processedElementHTMLObject.tagName.toLowerCase()) {
                    currentMode = processedElementHTMLObject.tagName.toLowerCase();
                    await faceMesh.reset();
                }

                faceMesh.onResults(async function (results) {
                    let faceLandmarksPoints = results.multiFaceLandmarks[0];

                    if (faceLandmarksPoints) {
                        let resultCanvasContext = resultCanvasHTMLObject.getContext('2d');

                        // clean result canvas and display captured image from video
                        resultCanvasContext.clearRect(
                            0, 0, processedElementHTMLObject.clientWidth, processedElementHTMLObject.clientHeight
                        );
                        resultCanvasContext.drawImage(
                            results.image, 0, 0, resultCanvasHTMLObject.width, resultCanvasHTMLObject.height
                        );

                        await applyEffect(faceLandmarksPoints, effectObject, resultCanvasHTMLObject);

                        landmarksDetected = true;
                    } else {
                        landmarksDetected = false;
                    }
                });

                await faceMesh.send({image: processedElementHTMLObject});

                return landmarksDetected;
            },
        };
    }
)();

export default FaceMeshEngine;