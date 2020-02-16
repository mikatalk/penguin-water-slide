import {
  Mesh,
  PlaneBufferGeometry,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  RawShaderMaterial,
  Quaternion,
  FrontSide,
  NormalBlending
} from 'three'

const inv255 = .003921569

const vertexShader = `
  precision highp float;

  #define PI 3.1415926536
  #define PI2 6.28318530718

  attribute vec3 position;
  attribute vec3 offset;
  attribute vec4 color;
  attribute float scale;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float time;
  attribute vec2 uv;
  varying vec2 vUv;
  varying vec4 vColor;
  attribute float particleIndex;
  uniform vec4 orientation;
  
  vec3 applyQuaternionToVector( vec4 q, vec3 v ){
    return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
  }

  void main(){

    vColor = color;
    vec3 pos = position * vec3(scale, scale, 1.0);
    pos = applyQuaternionToVector(orientation, pos);
    pos = pos + offset;
    vUv = vec2(uv.x, 1.0-uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0 );
  }
`
const fragmentShader = `
  precision highp float;

  varying vec4 vColor;
  varying vec2 vUv;

  float drawBase (in vec2 uv, in float min, in float max) {
    float dist = sqrt(dot(uv, uv));
    if (dist >= max || dist <= min) {
      return 0.0;
    }
    float sm = smoothstep(max, max - 0.01, dist);
    float sm2 = smoothstep(min, min - 0.01, dist);
    float alpha = sm * sm2;
    return (1.0-alpha);
  }

  void main() {
    float alpha = drawBase(vUv - vec2(0.5), 0.0, 0.5);
    // discard if not needed
    if (alpha == 0.0) {
      discard;
    }
    vec4 color = vColor;
    color.a = alpha * max(0.0, 0.6 - sin(length(vUv - vec2(0.5)))) * 0.4;
    gl_FragColor = clamp(vec4(0), vec4(1), color);
  }
`

export default class LiquidParticles extends Mesh {
  
  constructor ({world}) {
    // count how many liquid particles were created in the simulation 
    // and create as many instances for the renderer
    const numberOfParticles = world.particleSystems[0].GetPositionBuffer().length / 2
    
    
    // create an instanced buffer from a plane buffer geometry 
    const geometry = new InstancedBufferGeometry()
    geometry.copy(new PlaneBufferGeometry(1, 1, 1, 1))
    // Add/generate attributes buffers for the geometry
    const offsets = []
    const colors = []
    const scales = []
    for (let i = 0; i < numberOfParticles; i += 1) {
      offsets.push(
        0, 0, 0
      )
      colors.push(
        0, 0, 0, 0
      )
      scales.push(0.6)
    }
    geometry.setAttribute('offset', new InstancedBufferAttribute(new Float32Array(offsets), 3))
    geometry.setAttribute('color', new InstancedBufferAttribute(new Float32Array(colors), 4))
    geometry.setAttribute('scale', new InstancedBufferAttribute(new Float32Array(scales), 1))
      
    const material = new RawShaderMaterial( {
      uniforms: {
        time: { value: 1.0 },
        orientation: {type: 'v4', value: new Quaternion()},
      },
      vertexShader,
      fragmentShader,
      depthWrite:false,
      side: FrontSide, // only front since the plane will always face the camera
      transparent: true,
      alphaTest: 0.005,
      blending: NormalBlending
    })

    super(geometry, material)
    
    this.numberOfParticles = numberOfParticles
    this.frustumCulled = false
    this.resetBuffers(world)
  }

  resetBuffers (world) {
    for (let system of world.particleSystems) {
      const particles = system.GetPositionBuffer()
      const colors = system.GetColorBuffer()
      const offsetsArray = this.geometry.attributes.offset.array
      const colorsArray = this.geometry.attributes.color.array
      for (var i2 = 0, i3 = 0, i4 = 0, l = particles.length; i2 < l; i2 += 2, i3 += 3, i4 += 4) {
        offsetsArray[i3] = 0
        offsetsArray[i3 + 1] = 0
        offsetsArray[i3 + 2] = 0
        colorsArray[i4] = colors[i4] * inv255
        colorsArray[i4 + 1] = colors[i4 + 1] * inv255
        colorsArray[i4 + 2] = colors[i4 + 2] * inv255
        colorsArray[i4 + 3] = colors[i4 + 3] * inv255
      }
    }
    this.geometry.attributes.offset.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
  }

  draw (world) {
    for (let system of world.particleSystems) {
      const particles = system.GetPositionBuffer()
      const velocities = system.GetVelocityBuffer()
      // uncomment the chunks below if you want to apply the color transfer filter 
      // const colors = system.GetColorBuffer()
      const offsetsArray = this.geometry.attributes.offset.array
      // const colorsArray = this.geometry.attributes.color.array
      for (var i2 = 0, i3 = 0, i4 = 0, l = particles.length; i2 < l; i2 += 2, i3 += 3, i4 += 4) {
        const y = particles[i2 + 1]
        if (y < -25) {
          particles[i2 + 0] = -15 + Math.random() * 30
          particles[i2 + 1] = 30 + Math.random() * 2
          velocities[i2 + 0] = 0
          velocities[i2 + 1] = 0
          // // if you want to change the color as well on reset:
          // colors[i4 + 0] = 0//Math.round(Math.random() * 255)
          // colors[i4 + 1] = 0//Math.round(Math.random() * 255)
          // colors[i4 + 2] = 255//Math.round(Math.random() * 255)
          // colors[i4 + 3] = 255
        }
        offsetsArray[i3] = particles[i2]
        offsetsArray[i3 + 1] = particles[i2 + 1]
        // colorsArray[i4] = colors[i4] * inv255
        // colorsArray[i4 + 1] = colors[i4 + 1] * inv255
        // colorsArray[i4 + 2] = colors[i4 + 2] * inv255
        // colorsArray[i4 + 3] = colors[i4 + 3] * inv255
      }
    }
    this.geometry.attributes.offset.needsUpdate = true
    // this.geometry.attributes.color.needsUpdate = true
  }
}