// Although we setup externals already in the webpack config, 
// eslint was still complaining so this is just a proxy to the 
// library loaded via traditional script tag,
// and already available in the window

// link to global library
export const b2World = window['b2World']
export const b2_tensileParticle = window['b2_tensileParticle']
export const b2_dynamicBody = window['b2_dynamicBody']
export const b2PolygonShape = window['b2PolygonShape']
export const b2CircleShape = window['b2CircleShape']
export const b2Vec2 = window['b2Vec2']
export const b2BodyDef = window['b2BodyDef']
export const b2ParticleSystemDef = window['b2ParticleSystemDef']
export const b2ParticleGroupDef = window['b2ParticleGroupDef']
export const b2_waterParticle = window['b2_waterParticle']
export const b2_colorMixingParticle = window['b2_colorMixingParticle']
export const b2MouseJointDef = window['b2MouseJointDef']
export const b2AABB = window['b2AABB']
