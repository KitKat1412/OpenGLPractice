var gl = null;
var root = null;

const camera = {
  position: [10,0,0],
  up: [0,1,0],
  gaze: [-1, 0,0],
  rotation:{
    x: 0,
    y: 0
  }
};

/**
* loads the shader resources using a utility function
*/
loadResources({
  vs: 'shaders/vs.glsl',
  fs: 'shaders/fs.glsl'
}).then(function (resources) /*an object containing our keys with the loaded resources*/{
init(resources);
render();
});

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {
  //create a GL context
  gl = createContext(document.body.clientWidth, document.documentElement.clientHeight - 20);
  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);
  //enable alpha blending
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  //create scene graph
  root = createSceneGraph(gl, resources);
  initInteraction(gl.canvas);
}

/**
* creates the scene graph
*/
function createSceneGraph(gl, resources){
  //create the root
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs));
  //create the object
  let spheeah = new MaterialSGNode([new RenderSGNode(makeSphere())]);
  spheeah.ambient = [0.24725, 0.1995, 0.0745, 1];
  spheeah.diffuse = [0.75164, 0.60648, 0.22648, 1];
  spheeah.specular = [0.628281, 0.555802, 0.366065, 1];
  spheeah.shininess = 0.4;
  root.append(spheeah);
  //create the lighting
  let light = new LightSGNode();
  light.ambient = [0, 0, 0, 1];
  light.diffuse = [1, 1, 1, 1];
  light.specular = [1, 1, 1, 1];
  light.position = [0, 2, 2];
  rotateLight = new TransformationSGNode(mat4.create(), [
    new TransformationSGNode(glm.translate(0,-1.5, 0), [
        light
      ])
    ]);
    root.append(rotateLight);

  return root;
}

/**
* allow for user interaction via the mouse
*/
function initInteraction(canvas) {
  const mouse = {
    pos: { x : 0, y : 0},
    leftButtonDown: false
  };
  function toPos(event) {
    //convert to local coordinates
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  canvas.addEventListener('mousedown', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = event.button === 0;
  });
  canvas.addEventListener('mousemove', function(event) {
    const pos = toPos(event);
    const delta = { x : mouse.pos.x - pos.x, y: mouse.pos.y - pos.y };
    //TASK 0-1 add delta mouse to camera.rotation if the left mouse button is pressed
    if (mouse.leftButtonDown) {
      //add the relative movement of the mouse to the rotation variables
  		camera.rotation.x += delta.x;
  		camera.rotation.y += delta.y;
    }
    mouse.pos = pos;
  });
  canvas.addEventListener('mouseup', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = false;
  });
  //register globally
  document.addEventListener('keypress', function(event) {
    //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    if (event.code === 'KeyR') {
      camera.rotation.x = 0;
  		camera.rotation.y = 0;
    }
  });
}

/**
* render one frame
*/
function render(timeInMilliseconds) {
  //clear and set the background color
  gl.clearColor(0.9,0.9,0.9,1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //create context
  const context = createSGContext(gl);
  //set timeInMilliseconds
  context.timeInMilliseconds = timeInMilliseconds;
  //calculate projection Matrix
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  //calculate view Matrix
  context.viewMatrix = calculateViewMatrix(timeInMilliseconds);
  // context.viewMatrix = mat4.lookAt(mat4.create(), [0,1,-10], [0,0,0], [0,1,0]);
  //calculate inverse view Matrix
  context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);
  context.sceneMatrix = mat4.multiply(mat4.create(), glm.rotateY(camera.rotation.x), glm.rotateX(camera.rotation.y));
  root.render(context);
  requestAnimationFrame(render);
}

function calculateViewMatrix(timeInMilliseconds){
  var eye, center, up;

  eye = camera.position;
  center = vec3.add(vec3.create(), camera.position, camera.gaze);
  up = camera.up;

  return mat4.lookAt(mat4.create(), eye, center, up);
}
