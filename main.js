
var gl = null;
var root = null;
var rotateLight, rotateSpheeah, earth;
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
  texture: 'textures/ihatethis.jpg',
  space: 'textures/space3.jpg',
  space2: 'textures/space2.png'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

function init(resources) {
  //create a GL context
  gl = createContext();

  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  root = createSceneGraph(gl, resources);
  initInteraction(gl.canvas);
}

function createSceneGraph(gl, resources) {
  //create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs));

  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
      new RenderSGNode(makeSphere(.1))
    ]);
  }

  {
    let light = new LightSGNode([27,0,0]);
    light.ambient = [.2, .2, .2, 1];
    // light.diffuse = [1, 1, 1, 1];
    // light.specular = [1, 1, 1, 1];
    // light.position = [0, 2, 2];
    light.append(createLightSphere());
    // light.append(new RenderSGNode(makeSphere(.2,10,10)));

    rotateLight = new TransformationSGNode(mat4.create(), [
        light
    ]);
    root.append(light);
    // root.append(rotateLight);
  }


  {
    //EARTH
    let spheeah =new MaterialSGNode(new AdvancedTextureSGNode(resources.texture,0, 'u_tex',
            // new RenderSGNode(makeRect(2, 2))
      new RenderSGNode(makeSphere(2))
    ));

    spheeah.ambient = [0.7, 0.7, 0.7, 1];
    // spheeah.diffuse = [0.7, 0.1, 0.1, 1];
    // spheeah.specular = [0.0, 0.0, 0.5, 1];
    // spheeah.shininess = 0.7;
    rotateSpheeah = new TransformationSGNode(glm.transform({ translate: [0,-1.5,0], rotateX: -90}), [
      spheeah
    ]);
    // root.append(spheeah);
    root.append(rotateSpheeah);
  }

  {
    //MOON

  }

  {
      //SPACE
    const root2 = new ShaderSGNode(createProgram(gl, resources.vs_env, resources.fs_env));
    root.append(root2);

    let space = new MaterialSGNode(new AdvancedTextureSGNode(resources.space2, 1, 'u_tex',
      new RenderSGNode(makeSphere(30))));

      space.ambient = [0.7, 0.7, 0.7, 1];
      space.specular = [0.7,0.7,0.7,1];
      root2.append(space);
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


function render(timeInMilliseconds) {
  checkForWindowResize(gl);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  //set background color to light gray
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0,1,-10], [0,0,0], [0,1,0]);
  context.inviewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

  //rotate whole scene according to the mouse rotation stored in
  //camera.rotation.x and camera.rotation.y
  context.sceneMatrix = mat4.multiply(mat4.create(),
                            glm.rotateY(camera.rotation.x),
                            glm.rotateX(camera.rotation.y));

  //enable light rotation
  rotateLight.matrix = glm.rotateY(timeInMilliseconds*0.05);
  //enable earth rotation
  rotateSpheeah.matrix = glm.rotateY(-timeInMilliseconds*0.1)


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
