export const LiquidShader = {

	uniforms: {
		tDiffuse: { value: null },
	},

  vertexShader: `
    varying vec2 vUv;
    void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
	
	fragmentShader: `
    uniform sampler2D tDiffuse;
		varying vec2 vUv;
		void main() {
      vec4 sample = texture2D(tDiffuse, vUv);
      if (sample.a < 0.35) {
        discard;
      }
      if (sample.a < 0.45) {
        gl_FragColor = vec4(1.0);
      } else {
        gl_FragColor = sample;
      }
		}
  `
}	
