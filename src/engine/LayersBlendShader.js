
export const LayersBlendShader = {

	uniforms: {

		'textureBackground': { type: 't', value: null },
		'textureLiquid': { type: 't', value: null },
		'tDiffuse': { type: 't', value: null },
	},

	vertexShader: `
	  varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	`,

	fragmentShader: `

		uniform sampler2D textureBackground;
		uniform sampler2D textureLiquid;
		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {
			vec4 background = texture2D(textureBackground, vUv);
			vec4 liquid = texture2D(textureLiquid, vUv);
			vec4 foreground = texture2D(tDiffuse, vUv);
			vec3 color = background.rgb;
			color = mix(color.rgb, liquid.rgb, mix(liquid.a, foreground.a, 0.5));
			color = mix(color.rgb, foreground.rgb, foreground.a);
			float alpha = max(max(background.a, liquid.a), foreground.a);
			gl_FragColor = vec4(color, alpha);
		}
	`
}
	