
var gl = null;
var root = null;
var rootnospace = null;
var rotateSpace, rotateSpheeah, rotateMoon, negMoon;
var shadowNode, light;
var renderTargetColorTexture;
var renderTargetDepthTexture;

//framebuffer variables
var renderTargetFramebuffer;
var framebufferWidth = 1024;
var framebufferHeight = 1024;

var lightViewProjectionMatrix;
const camera = {
  rotation: {
    x: 0,
    y: 0
  }
};

var envcubetexture;

//load the shader resources using a utility function
loadResources({
  vs: 'shader/phong.vs.glsl',
  fs: 'shader/phong.fs.glsl',
  vs_single: 'shader/single.vs.glsl',
  fs_single: 'shader/single.fs.glsl',
  vs_env: 'shader/envmap.vs.glsl',
  fs_env: 'shader/envmap.fs.glsl',
  vs_shadow: 'shader/shadow.vs.glsl',
  fs_shadow: 'shader/shadow.fs.glsl',
  texture: 'textures/ihatethis.jpg',
  space: 'textures/space3.jpg',
  space2: 'textures/space2.png',
  moon: 'textures/moon.png'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

function init(resources) {
  //create a GL context
  gl = createContext(400,400);

  initRenderToTexture();

  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  root = createSceneGraph(gl, resources);

  rootnospace = new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single));
  // rootnospace.append(rotateSpheeah);
  rootnospace.append(negMoon);
  initInteraction(gl.canvas);
}
function initRenderToTexture() {
  var depthTextureExt = gl.getExtension("WEBGL_depth_texture");
  if(!depthTextureExt) { alert('No depth texture support!!!'); return; }

  //generate color texture (required mainly for debugging and to avoid bugs in some WebGL platforms)
  renderTargetFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, renderTargetFramebuffer);

  //create color texture
  renderTargetColorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, renderTargetColorTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebufferWidth, framebufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  //create depth texture
  renderTargetDepthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, renderTargetDepthTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, framebufferWidth, framebufferHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

  //bind textures to framebuffer
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTargetColorTexture, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, renderTargetDepthTexture ,0);

  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!=gl.FRAMEBUFFER_COMPLETE)
    {alert('Framebuffer incomplete!');}

  //clean up
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

}

function createSceneGraph(gl, resources) {
  //create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs_shadow, resources.fs_shadow));

  shadowNode = new ShadowSGNode(renderTargetDepthTexture,3,framebufferWidth,framebufferHeight);
  root.append(shadowNode);

  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
      new RenderSGNode(makeSphere(.1))
    ]);
  }

  {
    light = new LightSGNode();
    light.ambient = [.2, .2, .2, 1];
    // light.diffuse = [1, 1, 1, 1];
    // light.specular = [1, 1, 1, 1];
    light.position = [37,0,0];
    light.append(createLightSphere());
    shadowNode.append(light);
  }


  {
    //EARTH
   var spheeah =new MaterialSGNode(new AdvancedTextureSGNode(resources.texture,0, 'u_tex',
            // new RenderSGNode(makeRect(2, 2))
      new RenderSGNode(makeSphere(4))
    ));

    spheeah.ambient = [0.7, 0.7, 0.7, 1];
    // spheeah.diffuse = [0.7, 0.1, 0.1, 1];
    // spheeah.specular = [0.0, 0.0, 0.5, 1];
    // spheeah.shininess = 0.7;
    rotateSpheeah = new TransformationSGNode(glm.transform({ translate: [3,0,0], rotateX: 90}), [
      spheeah
    ]);
    // root.append(spheeah);
    shadowNode.append(rotateSpheeah);
  }

  {
    //MOON
    let moon =new MaterialSGNode(new AdvancedTextureSGNode(resources.moon,2, 'u_tex',
            // new RenderSGNode(makeRect(2, 2))
      new RenderSGNode(makeSphere(1))
    ));

    moon.ambient = [0.7, 0.7, 0.7, 1];
    // spheeah.diffuse = [0.7, 0.1, 0.1, 1];
    // spheeah.specular = [0.0, 0.0, 0.5, 1];
    // spheeah.shininess = 0.7;
    rotateMoon = new TransformationSGNode(mat4.create(), [
        moon
    ]);
    negMoon = new TransformationSGNode(mat4.create(), [moon]);
    // spheeah.append(rotateMoon);
    shadowNode.append(rotateMoon);
  }

  {
      //SPACE
    const root2 = new ShaderSGNode(createProgram(gl, resources.vs_env, resources.fs_env));
    shadowNode.append(root2);

    let space = new MaterialSGNode(new AdvancedTextureSGNode(resources.space2, 1, 'u_tex',
      new RenderSGNode(makeSphere(40))));

      space.ambient = [0.7, 0.7, 0.7, 1];
      space.specular = [0.7,0.7,0.7,1];
      rotateSpace = new TransformationSGNode(mat4.create(), [space]);
      root2.append(rotateSpace);
  }

  return root;
}

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
    //add delta mouse to camera.rotation if the left mouse button is pressed
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
function renderToTexture(timeInMilliseconds)
{
  //bind framebuffer to draw scene into texture
  gl.bindFramebuffer(gl.FRAMEBUFFER, renderTargetFramebuffer);

  //setup viewport
  gl.viewport(0, 0, framebufferWidth, framebufferHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //setup context and camera matrices
  const context = createSGContext(gl);
  //setup a projection matrix for the light camera which is large enough to capture our scene
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30),  framebufferWidth / framebufferHeight, 2, 200);
  //compute the light's position in world space
  let lightModelMatrix = mat4.create();
  let lightPositionVector = vec4.fromValues(0,0,0,1);
  let worldLightPos = vec4.transformMat4(vec4.create(), lightPositionVector, lightModelMatrix);
// let worldLightPos = vec4.transformMat4(vec4.create(), lightPositionVector, mat4.create());
  //let the light "shine" towards the scene center (i.e. towards C3PO)
  let worldLightLookAtPos = [0,0,-1];
  let upVector = [0,1,0];
  //TASK 1.1: setup camera to look at the scene from the light's perspective
  let lookAtMatrix = mat4.lookAt(mat4.create(), worldLightPos, worldLightLookAtPos, upVector);
  // let lookAtMatrix = mat4.lookAt(mat4.create(), [27,0,0], [0,0,0], upVector);
  // let lookAtMatrix = mat4.lookAt(mat4.create(), [0,1,-10], [0,0,0], [0,1,0]); //replace me for TASK 1.1
  context.viewMatrix = lookAtMatrix;

  //multiply and save light projection and view matrix for later use in shadow mapping shader!
  shadowNode.lightViewProjectionMatrix = mat4.multiply(mat4.create(), context.projectionMatrix,context.viewMatrix);

  //render scenegraph
  rootnospace.render(context); //scene graph without floor to avoid reading from the same texture as we write to...

  //disable framebuffer (render to screen again)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function render(timeInMilliseconds) {
  checkForWindowResize(gl);
  rotateSpheeah.matrix = glm.transform({translate: [0,0,0], rotateY: timeInMilliseconds*0.3});
  rotateSpace.matrix = glm.transform({rotateY: -timeInMilliseconds*0.001});
  //enable moon rotation
  rotateMoon.matrix = glm.transform({translate: [-15*Math.cos(timeInMilliseconds*0.0005),2*Math.cos(timeInMilliseconds*0.0005+3),15*Math.sin(timeInMilliseconds*0.0005)], rotateY:-timeInMilliseconds*0.4 });//glm.rotateY(-timeInMilliseconds*0.1);
  negMoon.matrix = glm.transform({translate: [15*Math.cos(timeInMilliseconds*0.00025), 3*Math.cos(timeInMilliseconds*0.00025+3), 25*Math.sin(timeInMilliseconds*0.00025)], scale: 0.2});
  // rotateMoon.matrix = glm.transform({translate: [3,0,0]});
  renderToTexture(timeInMilliseconds);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  //set background color to light gray
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);

  let lookAtMatrix = mat4.lookAt(mat4.create(), [35,0,0], [0,0,0], [0,1,0]);
    let mouseRotateMatrix = mat4.multiply(mat4.create(),
                            glm.rotateX(camera.rotation.y),
                            glm.rotateY(camera.rotation.x));
  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
  // context.viewMatrix = mat4.lookAt(mat4.create(), [0,1,-10], [0,0,0], [0,1,0]);
  context.invviewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

  root.render(context);

  //animate
  requestAnimationFrame(render);
}

class TextureSGNode extends SGNode {
  constructor(texture, textureunit, children ) {
      super(children);
      this.texture = texture;
      this.textureunit = textureunit;
  }

  render(context)
  {
    //tell shader to use our texture
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_enableObjectTexture'), 1);

    //set additional shader parameters
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_tex'), this.textureunit);

    //activate and bind texture
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    //render children
    super.render(context);

    //clean up
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_2D, null);

    //disable texturing in shader
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_enableObjectTexture'), 0);
  }
}
class ShadowSGNode extends SGNode {
  constructor(shadowtexture, textureunit, width, height, children) {
      super(children);
      this.shadowtexture = shadowtexture;
      this.textureunit = textureunit;
      this.texturewidth = width;
      this.textureheight = height;

      this.lightViewProjectionMatrix = mat4.create(); //has to be updated each frame
  }

  render(context) {
    //set additional shader parameters
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_depthMap'), this.textureunit);

    //pass shadow map size to shader (required for extra task)
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_shadowMapWidth'), this.texturewidth);
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_shadowMapHeight'), this.textureheight);

    //TASK 2.1: compute eye-to-light matrix by multiplying this.lightViewProjectionMatrix and context.invViewMatrix
    //Hint: Look at the computation of lightViewProjectionMatrix to see how to multiply two matrices and for the correct order of the matrices!
    var eyeToLightMatrix = mat4.multiply(mat4.create(),this.lightViewProjectionMatrix,context.invViewMatrix);
    // var eyeToLightMatrix = mat4.create();
    // var eyeToLightMatrix = mat4.multiply(mat4.create(), context.invViewMatrix, this.lightViewProjectionMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_eyeToLightMatrix'), false, eyeToLightMatrix);

    //activate and bind texture
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowtexture);

    //render children
    super.render(context);

    //clean up
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}
