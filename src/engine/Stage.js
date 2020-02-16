import { Clock, PerspectiveCamera, Scene, Vector3, OrthographicCamera, ShapeUtils, Sprite, SpriteMaterial, TextureLoader, RepeatWrapping } from 'three'
import { b2Vec2, b2World, b2BodyDef, b2MouseJointDef, b2AABB } from './liquidfun/ExternalsResolver'
import DynamicBodyQueryCallback from './liquidfun/DynamicBodyQueryCallback'
import {lerp} from './../utils/lerp'
import DebugLayer from './DebugLayer'
import LiquidParticles from './LiquidParticles'
import Renderer from './Renderer'
import Simulation from './Simulation'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { LiquidShader } from './LiquidShader'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { LayersBlendShader } from './LayersBlendShader.js';
import Penguin from './Penguin'

export default class Stage {

  static instance = null
  
  static initialize (container, cameraMode) {
    if (!Stage.instance) {
      Stage.instance = new Stage(container, cameraMode)
    }
  }
  
  static destroy () {
    Stage.instance && Stage.instance.destroy()
  }
  
  static setcameraMode (mode) {
    Stage.instance && Stage.instance.setcameraMode(mode)
  }
  
  // settings:
  settings = {
    liquidColor: [60, 110, 240, 255],
    numberOfPenguins: 6,
    spawnAreaRadius: 4,
    // debugPhysics: false,
    debugPhysics: true,
    velocityIterations: 1,
    positionIterations: 1,
  }

  leader = {
    name: '',
    position: {
      x:0, y:0
    }
  }

  // physics:
  simulation
  mouseJoint
  // three:
  renderer
  composer
  cameraMode = 'follow'
  // scenes
  sceneBackground
  sceneLiquid
  sceneForeground
  // meshes
  penguins = {}
  liquidParticles
  // debug
  debugLayer
  // utils:
  clock
  paused
  renderCallBack

  constructor (container, cameraMode) {

    this.container = container
    this.cameraMode = cameraMode

    this.clock = new Clock()

    this.simulation = new Simulation(
      this.settings.numberOfPenguins, 
      this.settings.spawnAreaRadius,
      this.settings.liquidColor
    )
    
    // set the 4th penguin as camera target to follow
    for (let body of this.simulation.world.bodies) {
      const {childName} = body
      if (childName === 'penguin-4') {
        this.targetToFollow = body
      }
    }
    
    this.renderer = new Renderer()
    
    this.camera = new PerspectiveCamera(
      /* fov */    70,
      /* aspect */ window.innerWidth / window.innerHeight,
      /* near */   0.001,
      /* far */    50
    )
    
    this.sceneBackground = new Scene()
    this.sceneLiquid = new Scene()
    this.sceneForeground = new Scene()
    
    this.container.appendChild(this.renderer.domElement)
    
    this.liquidParticles = new LiquidParticles(this.simulation)
    this.sceneLiquid.add(this.liquidParticles)
    
    if (this.settings.debugPhysics) {
      this.debugLayer = new DebugLayer()
      this.sceneForeground.add(this.debugLayer.buffer)
    }

    const backgroundMap = new TextureLoader().load(require('./../assets/background.png'))
    
    const backgroundMaterial = new SpriteMaterial({
      map: backgroundMap,
      // sizeAttenuation: false
    })
    this.background = new Sprite(backgroundMaterial)
    this.sceneBackground.add(this.background)
    
    const scale = 40
    this.background.position.x = 3
    this.background.position.y = 11
    this.background.position.z = -1
    this.background.scale.set(scale, scale, scale)
  
    const renderPassBackground = new RenderPass(this.sceneBackground, this.camera)
    const renderPassLiquid = new RenderPass(this.sceneLiquid, this.camera)
    const renderPassForeground = new RenderPass(this.sceneForeground, this.camera)

    const backgroundCopyPass = new ShaderPass(CopyShader)
    
    this.effectLiquid = new ShaderPass(LiquidShader)
    const liquidCopyPass = new ShaderPass(CopyShader)
    
    //final blend pass is drawn to screen
    const blendPass = new ShaderPass(LayersBlendShader)
    
    
    this.composerBackground = new EffectComposer(this.renderer)
    this.composerBackground.addPass(renderPassBackground)
    this.composerBackground.addPass(backgroundCopyPass)

    this.composerLiquid = new EffectComposer(this.renderer)
    this.composerLiquid.addPass(renderPassLiquid)
    this.composerLiquid.addPass(this.effectLiquid)
    this.composerLiquid.addPass(liquidCopyPass)
    
    this.composerForeground = new EffectComposer(this.renderer)
    this.composerForeground.addPass(renderPassForeground)
    this.composerForeground.addPass(blendPass)


    blendPass.uniforms.textureBackground.value = this.composerBackground.renderTarget1.texture
    blendPass.uniforms.textureLiquid.value = this.composerLiquid.renderTarget1.texture
    blendPass.renderToScreen = true
    
    for (let i = 0; i < this.settings.numberOfPenguins; i += 1) {
      const name = `penguin-${i + 1}`
      const penguin = new Penguin()
      this.penguins[name] = penguin
      this.sceneForeground.add(penguin)
    }

    this.addListeners()
    this.handleWindowResize()
    this.loop()
  }

  setcameraMode (mode) {
    this.cameraMode = mode
  }


  loop = () => {
    this.renderCallBack = requestAnimationFrame(this.loop)
    this.render()
  }
    
  render () {
    if (this.paused) {
      return
    }

    // position camera
    if (this.cameraMode === 'follow' && this.targetToFollow) {
      const pt = this.targetToFollow.GetTransform().p
      this.camera.position.x = lerp(this.camera.position.x, pt.x, 0.8)
      this.camera.position.y = lerp(this.camera.position.y, pt.y, 0.8)
      this.camera.position.z = lerp(this.camera.position.z, 11, 0.8)
    } else {
      this.camera.position.x = lerp(this.camera.position.x, 3, 0.98)
      this.camera.position.y = lerp(this.camera.position.y, 11, 0.98)
      this.camera.position.z = lerp(this.camera.position.z, 28, 0.98)
    }

    const elapsedTime = this.clock.elapsedTime
    const delta = this.clock.getDelta()
    this.simulation.world.Step(Math.min(0.03, delta), this.settings.velocityIterations, this.settings.positionIterations)

    if (this.settings.debugPhysics) {
      this.debugLayer.currentVertex = 0
      this.debugLayer.draw(this.simulation.world)
    }
    
    this.liquidParticles.draw(this.simulation.world)
  
    for (let body of this.simulation.world.bodies) {
      const {childName} = body
      if (childName && childName in this.penguins) {
        this.penguins[childName].draw(body)
      }
    }
    this.renderer.clear()

    this.composerBackground.render()
    this.composerLiquid.render()
    this.composerForeground.render()
  }
  
  handleWindowResize = () => {
    this.stageWidth = window.innerWidth
    this.stageHeight = window.innerHeight
    this.renderer.setSize(this.stageWidth, this.stageHeight)
    this.camera.aspect = this.stageWidth / this.stageHeight
    this.camera.updateProjectionMatrix()
    this.composerBackground.setSize(this.stageWidth, this.stageHeight)
    this.composerLiquid.setSize(this.stageWidth, this.stageHeight)
    this.composerForeground.setSize(this.stageWidth, this.stageHeight)
  }
  
  handleMouseDown = event => {
    if (this.mouseJoint) {
      this.simulation.world.DestroyJoint(this.mouseJoint)
      this.mouseJoint = null
    }
    const p = this.getMouseCoords(event)
    const aabb = new b2AABB()
    const d = new b2Vec2()
    d.Set(0.01, 0.01)
    b2Vec2.Sub(aabb.lowerBound, p, d)
    b2Vec2.Add(aabb.upperBound, p, d)

    const queryCallback = new DynamicBodyQueryCallback(p)
    this.simulation.world.QueryAABB(queryCallback, aabb)

    if (queryCallback.fixture) {
      const {body} = queryCallback.fixture
      const md = new b2MouseJointDef()
      md.bodyA = this.simulation.groundBody
      md.bodyB = body
      md.target = p
      md.maxForce = 1000 * body.GetMass()
      this.mouseJoint = this.simulation.world.CreateJoint(md)
      body.SetAwake(true)
      this.targetToFollow = body
    }
  }

  handleMouseMove = event => {
    if (this.mouseJoint) {
      const p = this.getMouseCoords(event)
      this.mouseJoint.SetTarget(p)
    }
  }

  handleMouseUp = event => {
    if (this.mouseJoint) {
      this.simulation.world.DestroyJoint(this.mouseJoint)
      this.mouseJoint = null
    }
  }

  getMouseCoords (event) {
    const {touches} = event
    const {top, left} = this.renderer.domElement.getBoundingClientRect()    
    let clientX, clientY
    if (touches && touches.length) {
      clientX = touches[0].clientX - left 
      clientY = touches[0].clientY  - top
    } else {
      clientX = event.clientX - left 
      clientY = event.clientY - top
    }

    const mouse = new Vector3()
    mouse.x = (clientX / this.stageWidth) * 2 - 1
    mouse.y = -(clientY / this.stageHeight) * 2 + 1
    mouse.z = 0.5
    mouse.unproject(this.camera)
    const dir = mouse.sub(this.camera.position).normalize()
    const distance = -this.camera.position.z / dir.z
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance))
    return new b2Vec2(pos.x, pos.y)
  }

  destroy () {
    window.cancelAnimationFrame(this.renderCallBack)
    this.simulation.destroy()
    this.removeListeners()
  }

  addListeners () {
    document.addEventListener('touchstart', this.handleMouseDown, false)
    document.addEventListener('touchmove', this.handleMouseMove, false)
    document.addEventListener('touchend', this.handleMouseUp, false)
    document.addEventListener('touchcancel', this.handleMouseUp, false)

    document.addEventListener('mousedown', this.handleMouseDown, false)
    document.addEventListener('mousemove', this.handleMouseMove, false)
    document.addEventListener('mouseup', this.handleMouseUp, false)
    document.addEventListener('mouseout', this.handleMouseUp, false)

    window.addEventListener('resize', this.handleWindowResize, false)
  }

  removeListeners () {
    document.removeEventListener('touchstart', this.handleMouseDown)
    document.removeEventListener('touchmove', this.handleMouseMove)
    document.removeEventListener('touchend', this.handleMouseUp)
    document.removeEventListener('touchcancel', this.handleMouseUp)

    document.removeEventListener('mousedown', this.handleMouseDown)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('mouseout', this.handleMouseUp)

    window.removeEventListener('resize', this.handleWindowResize)
  }

}
  