import FaceMeshProcessor from './Lib/Mediapipe/face_mesh/FaceMeshProcessor.js';

const VirtualMirror = (function () {

        return { // Public Area
            apply: function (sourceElementId, resultCanvasElementId, effectObject) {
                let element = document.getElementById(sourceElementId);
                let resultCanvasHTMLObject = document.getElementById(resultCanvasElementId);

                FaceMeshProcessor.process(element, resultCanvasHTMLObject, effectObject);
            },

            terminate: function () {
                FaceMeshProcessor.terminate();
            }

        };
    }
)();

Object.defineProperty(window, 'VirtualMirror', {
    value: VirtualMirror,
    writable: false,
    configurable: false
});

export default VirtualMirror;
