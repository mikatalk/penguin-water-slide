<template>
  <div id="app">
    <div class="canvas-container" ref="canvas-container"></div>
    <button @click="toggleCameraMode">Toggle Camera View - {{cameraMode}}</button> 
  </div>
</template>

<script>
import Stage from './engine/Stage'

export default {
  name: 'App',
  data: () => ({
    cameraMode: 'full'
  }),
  mounted () {
    Stage.initialize(this.$refs['canvas-container'], this.cameraMode)
  },
  beforeDestroy () {
    Stage.destroy()
  },
  methods: {
    toggleCameraMode () {
      this.cameraMode = this.cameraMode === 'follow' ? 'full' : 'follow'
      Stage.setcameraMode(this.cameraMode)
    }
  }
}
</script>

<style lang="scss">
body {
  background: black;
  margin: 0;
  overflow: hidden;
  font-size: 18px;

  .canvas-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    background: #bcf5ff;
    canvas {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }
  }
  button {
    position: fixed;
    top: 0.5rem;
    left: 0.5rem;
    border: 2px solid #ffffff;
    border-radius: 5px;
    background: #64cee9;
    color: white;
    font-family: monospace;
    font-weight: 100;
    font-size: 1rem;
    padding: 0.25rem 1rem;
    cursor: pointer;
    z-index: +1;
    &:focus {
      outline: none;
    }
  }
}
</style>
