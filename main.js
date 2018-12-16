var gl = null;
var root = null;

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
  // root = createSceneGraph(gl, resources);
  root = createProgram(gl, resources.vs, resources.fs);
}
/**
* render one frame
*/
function render(timeInMilliseconds) {
  //clear and set the background color
  gl.clearColor(0.5,0.5,0.5,1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //create context
  //const context = createSGContext(gl);
  //set timeInMilliseconds
  gl.timeInMilliseconds = timeInMilliseconds;

  //root.render(context);
  requestAnimationFrame(render);
}

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
