/////////////////////////////////////////////////////////////////////////////////////
//  The section below implement the draw method on b2 shapes to copy the vertices  //
//  positions to the renderer buffer                                               //
/////////////////////////////////////////////////////////////////////////////////////

window['b2CircleShape'].prototype.draw = function(transform, renderer) {
  const circlePosition = this.position
  const center = new window['b2Vec2'](circlePosition.x, circlePosition.y)
  renderer.insertCircleVertices(transform, this.radius, center.x, center.y, 0, 0, 0, 5)
}

window['b2PolygonShape'].prototype.draw = function(transform, renderer) {
  const zPosition = renderer.currentVertex * 3
  renderer.transformVerticesAndInsert(this.vertices, transform, 0, 0, 0)
  const positions = renderer.positions
  const last = (renderer.currentVertex - 1) * 3
  renderer.insertLine(positions[last], positions[last + 1],
                      positions[zPosition], positions[zPosition + 1],
                      0, 0, 0)
}
