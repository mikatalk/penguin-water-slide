import { BufferGeometry, BufferAttribute, LineSegments, LineBasicMaterial } from 'three'
import { b2Vec2 } from './liquidfun/ExternalsResolver'

export default class DebugLayer {
  constructor () {

    // init large buffer geometry
    this.maxVertices = 500
    var geometry = new BufferGeometry()
    geometry.dynamic = true

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.maxVertices * 3), 3))
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(this.maxVertices * 3), 3))

    this.positions = geometry.attributes.position.array
    this.colors = geometry.attributes.color.array
    this.currentVertex = 0
    this.buffer = new LineSegments(geometry,
      new LineBasicMaterial({ 
        vertexColors: true,
      }), LineSegments)

    this.circleVertices = []
    this.circleResolution = 10
    this.initCircleVertices(this.circleVertices, this.circleResolution)

    this.particleVertices = []
    this.particleResolution = 3
    this.initCircleVertices(this.particleVertices, this.particleResolution)
  }

  collapseBuffer () {
    var i = this.currentVertex * 3
    for (; i < this.maxVertices * 3; i++) {
      this.positions[i] = 0
      this.colors[i] = 0
    }
  }

  // draw ({bodies, particleSystems}) {
  draw ({bodies}) {
    for (var i = 0, max = bodies.length; i < max; i++) {
      var body = bodies[i]
      var maxFixtures = body.fixtures.length
      var transform = body.GetTransform()
      for (var j = 0; j < maxFixtures; j++) {
        var fixture = body.fixtures[j]
        fixture.shape.draw(transform, this)
      }
    }

    /********************************* 
    // draw particle systems
    for (let system of particleSystems) {
      const particles = system.GetPositionBuffer()
      const color = system.GetColorBuffer()
      // console.log({particles, color})
      
      
      const transform = new b2Transform()
      transform.SetIdentity()
      
      // loop over all particles
      for (var i2 = 0, i4 = 0, l = particles.length; i2 < l; i2 += 2, i4 += 4) {
        this.insertParticleVertices(
          system.radius,
          particles[i2],
          particles[i2 + 1],
          color[i4] * inv255, color[i4 + 1] * inv255, color[i4 + 2] * inv255,
          3
          )
        }
      }
      */
        
        this.collapseBuffer()
        
        this.buffer.geometry.attributes.position.needsUpdate = true
    this.buffer.geometry.attributes.color.needsUpdate = true
  }

  insertLine (x1, y1, x2, y2, r, g, b) {
    var i = this.currentVertex;
    var threeI = i * 3;
    this.positions[threeI] = x1;
    this.positions[threeI + 1] = y1;
    this.positions[threeI + 2] = 0;
    this.colors[threeI] = r;
    this.colors[threeI + 1] = g;
    this.colors[threeI + 2] = b;

    i++;
    threeI = i * 3;
    this.positions[threeI] = x2;
    this.positions[threeI + 1] = y2;
    this.positions[threeI + 2] = 0;
    this.colors[threeI] = r;
    this.colors[threeI + 1] = g;
    this.colors[threeI + 2] = b;
    this.currentVertex += 2;
  }

  // TODO remove one of the muls
  insertCircleVertices (transform, radius, x, y, r, g, b) {
    var vertices = this.circleVertices;
    for (var i = 0; i < this.circleResolution; i++) {
      var i4 = i * 4;
      var v1 = new b2Vec2(vertices[i4] * radius + x, vertices[i4 + 1] * radius + y);
      var v2 = new b2Vec2(vertices[i4 + 2] * radius + x, vertices[i4 + 3] * radius + y);

      b2Vec2.Mul(v1, transform, v1);
      b2Vec2.Mul(v2, transform, v2);

      this.insertLine(v1.x, v1.y, v2.x, v2.y, r, g, b);
    }
  }

  insertParticleVertices (radius, x, y, r, g, b) {
    var vertices = this.particleVertices;
    for (var i = 0; i < this.particleResolution; i++) {
      var i4 = i * 4;
      var x1 = vertices[i4] * radius + x;
      var y1 = vertices[i4 + 1] * radius + y;
      var x2 = vertices[i4 + 2] * radius + x;
      var y2 = vertices[i4 + 3] * radius + y;

      this.insertLine(x1, y1, x2, y2, r, g, b);
    }
  }

  initCircleVertices = function(v, resolution) {
    var size = 360 / resolution;

    for (var i = 0; i < resolution; i++) {
      var s1 = (i * size) * Math.PI / 180;
      var s2 = ((i + 1) * size) * Math.PI / 180;
      v.push(Math.cos(s1));
      v.push(Math.sin(s1));
      v.push(Math.cos(s2));
      v.push(Math.sin(s2));
    }
  }


  transformAndInsert = function(v1, v2, transform, r, g, b) {
    var transformedV1 = new b2Vec2(),
      transformedV2 = new b2Vec2();

    b2Vec2.Mul(transformedV1, transform, v1);
    b2Vec2.Mul(transformedV2, transform, v2);
    this.insertLine(transformedV1.x, transformedV1.y,
      transformedV2.x, transformedV2.y,
      r, g, b);
  }

  transformVerticesAndInsert = function(vertices, transform, r, g, b) {
    var vertexCount = vertices.length;

    for (var i = 1; i < vertexCount; i++) {
      this.transformAndInsert(vertices[i - 1], vertices[i], transform,
        r, g, b);
    }
  }
}

