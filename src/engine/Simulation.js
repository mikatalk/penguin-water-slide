import { walls } from './Shapes'

import { b2BodyDef,
  b2World,
  b2Vec2,
  b2CircleShape,
  b2PolygonShape,
  b2ParticleSystemDef,
  b2ParticleGroupDef,
  // b2_waterParticle,
  b2_dynamicBody,
  // b2_colorMixingParticle,
  // b2MouseJointDef, 
  // b2AABB
}from './liquidfun/ExternalsResolver'
  
import { penguin } from './../assets/penguin.json'

export default class Simulation {

  constructor (numberOfPenguins, spawnAreaRadius, liquidColor) {
    // Initialize a world to run simulations on
    const gravity = new b2Vec2(0, -10)
    this.world = new b2World(gravity)
    // create a physics reference to the ground, needed for handling the mouse
    const groundBodyDef = new b2BodyDef()
    this.groundBody = this.world.CreateBody(groundBodyDef)
    // because liquidfun was compiled to use the global scope (window) 
    // we need to make sure it's available outside of the module
    window.world = this.world

    this.makeWalls()
    this.makeLiquidParticles(spawnAreaRadius, liquidColor)
    this.makePengiuns(numberOfPenguins)
  }

  makeWalls() {
    const def = new b2BodyDef()
    const ground = this.world.CreateBody(def)
    for (let wall of walls) {
      const shape = new b2PolygonShape()
      for (let xy of wall) {
        shape.vertices.push(new b2Vec2(...xy))
      }
      ground.CreateFixtureFromShape(shape, 0.0)
    }
  }

  makeLiquidParticles (spawnAreaRadius = 2, liquidColor = [160, 110, 240, 255]) {

    const psd = new b2ParticleSystemDef();
    psd.radius = 0.07;
    const particleSystem = this.world.CreateParticleSystem(psd);

    // one group
    const spawnArea = new b2CircleShape()
    spawnArea.position.Set(0, 30)
    spawnArea.radius = spawnAreaRadius
    const particleGroupDefinition = new b2ParticleGroupDef()
    particleGroupDefinition.shape = spawnArea
    particleGroupDefinition.color.Set(...liquidColor)
    particleSystem.CreateParticleGroup(particleGroupDefinition)
  }        
  makePengiuns (numberOfPenguins) {
    const penguinVertices = penguin.fixtures[0].vertices
    const scale = 0.014
    let bd = new b2BodyDef()
    bd.type = b2_dynamicBody
    bd.sleep = false
    for (let i = 0; i < numberOfPenguins; i++) {
      let body = this.world.CreateBody(bd)
      for (let triangle of penguinVertices) {
        const shape = new b2PolygonShape;
        for (let vertice of triangle) {
          shape.vertices.push(new b2Vec2(
            vertice.x * scale,
            vertice.y * scale
          ))
        }
        body.CreateFixtureFromShape(shape, 0.5)
      }
      body.childName = 'penguin-' + (i + 1)
      body.SetTransform(new b2Vec2(-15+i*4, 30), 0)
      body.SetLinearVelocity(new b2Vec2(0,0))
      body.SetAngularVelocity(0)  
    }
  }

  destroy () {
    if (this.world !== null) {
      while (this.world.joints.length > 0) {
        this.world.DestroyJoint(this.world.joints[0]);
      }
      while (this.world.bodies.length > 0) {
        this.world.DestroyBody(this.world.bodies[0]);
      }
      while (this.world.particleSystems.length > 0) {
        this.world.DestroyParticleSystem(this.world.particleSystems[0]);
      }
    }
  }
}
