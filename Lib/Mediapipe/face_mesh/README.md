# Virtual Mirror: based on Mediapipe FaceMesh lib

See official google lib here: https://ai.google.dev/edge/mediapipe/solutions/guide

WARNING! This is legacy library and not available in google anymore.

But this library consumes less resources of client and is more stable than the newest one.

Location: Lib/Mediapipe/face_mesh

### Directory Overview

- core - core files, main js lib, wasm files
- detector - objects which detects areas (eg brows, lips and so on)
- engine/VisionTaskEngine.js - this is the main logic for the library. DON'T USE IT OUTSIDE!
- VisionProcessor.js - is used for outside components. get input and applies effect

### Detector Overview

More details you can find in the classes.

Mind: each detector has resultCanvasElement, it should be an html element, e.g. document.getElementById("ID_HERE");

### Drawing utils

You can use incorporated drawing utils to show detected areas:

```
    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
    
    drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
    
    drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
    
    drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
    
    drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
    
    drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
    
    drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
    
    drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
```

### Usage:

Include FaceMeshProcessor.js in you code. Then you can use like that:

````
import FaceMeshProcessor from './Lib/Mediapipe/face_mesh/FaceMeshProcessor.js';

......

 /**
  * Where:
  * sourceElementId - if of <img> or <video> html object
  * resultCanvasHTMLObject - canvas where to show the resulting output
  * effectObject - object with effect settings (see effect objects to get more info)
 */
 apply: function (sourceElementId, resultCanvasElementId, effectObject) {
    let element = document.getElementById(sourceElementId);
    let resultCanvasHTMLObject = document.getElementById(resultCanvasElementId);
    FaceMeshProcessor.process(element, resultCanvasHTMLObject, effectObject);
 },
 
 terminate: function () {
    FaceMeshProcessor.terminate();
 }

````
### Effect objects examples:

The effect object must be sent here: FaceMeshProcessor.processVideo(element, resultCanvasHTMLObject, effectObject);

For colors:

```
{
    "effect": window.EFFECT_BROWS_COLOR, // @see Constants folder in the project
    "type": "color", // color||image
    "value": "#8c0000", //either HEX color or image url
    "saturation": 0.2 // OPTIONAL (see specific effect for that)
    "transparency": 0.2 // OPTIONAL (see specific effect for that)
}

e.g. for eyeglasses:

{  
  "effect": window.EFFECT_EYEGLASSES,
  "type": "image",
  "value": "http://DOMAIN/test.png", // masked image. see the project documentation
}
```
