import { WebGLRenderer } from 'three'

export default class Renderer extends WebGLRenderer {
  constructor () {
    super ({
      // antialias: true,
      antialias: false,
      alpha: true,
    })

    this.setClearColor(0, 0)
    this.setSize(this.windowWidth, this.windowHeight)
    this.setPixelRatio(window.devicePixelRatio)
    this.shadowMap.enabled = false

    const gl = this.getContext()
    if (!gl.getExtension('OES_texture_float')) {
      alert('client support error - float textures not supported')
      throw new Error('float textures not supported')
    }
    // we need to access textures from within the vertex shader
    //https://github.com/KhronosGroup/WebGL/blob/90ceaac0c4546b1aad634a6a5c4d2dfae9f4d124/conformance-suites/1.0.0/extra/webgl-info.html
    if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) === 0) {
      alert('client support error - vertex shader cannot read textures')
      throw new Error('vertex shader cannot read textures')
    }
    
  }
}
