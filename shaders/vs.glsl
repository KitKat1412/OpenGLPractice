/**
 * empty basic vertex shader
 */
 attribute vec3 a_position;
 attribute vec3 a_normal;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

uniform vec3 u_lightPos;

varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;

void main() {
	// gl_Position = u_projection * (u_modelView * vec4(a_position,1));
  //gl_Position = vec4(a_position,1);
  // v_color = vec3(0, 1, .6);
  vec4 eyePosition = u_modelView * vec4(a_position, 1);

  v_normalVec = u_normalMatrix * a_normal;
  v_eyeVec = -eyePosition.xyz;
  v_lightVec = u_lightPos - eyePosition.xyz;

  gl_Position = u_projection * eyePosition;
}
