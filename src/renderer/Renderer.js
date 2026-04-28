import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import Stats from "stats.js";

import * as THREE from "three";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass
} from "postprocessing";

export class Renderer extends React.Component {
  renderer = null;
  stats = new Stats();
  composer;
  canvas = null;
  useWebGL = true;

  aspect = window.innerWidth / window.innerHeight;

  resizeFunctions = [];

  state = {};

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { assetsLoadState, loadedCallback, availableComponent } = this.props;

    const prevScene = prevProps.availableComponent.scene;

    if (prevProps.assetsLoadState !== assetsLoadState && loadedCallback) {
      loadedCallback(assetsLoadState);
    }

    if (this.hasSceneOrCameraChanged(prevScene)) {
      this.setPostProcessing();
    }
  }

  hasSceneOrCameraChanged = prevScene => {
    const { availableComponent } = this.props;
    const { scene } = availableComponent;
    const _sceneChanged = scene.scene && scene !== prevScene;
    const _cameraChanged =
      scene.camera &&
      ((!prevScene.camera && prevScene.camera !== scene.camera) ||
        prevScene.camera._main !== scene.camera._main);

    const mainCameraReady = scene.camera._main;

    return (
      _sceneChanged ||
      _cameraChanged ||
      (this.state.ready && mainCameraReady && !this.effectPass)
    );
  };

  // TODO: improve this, add parameters on render redux state
  setPostProcessing = () => {
    const { availableComponent, postprocessing } = this.props;
    if (!postprocessing || !this.useWebGL) {
      return;
    }
    if (!this.composer) {
      this.composer = new EffectComposer(this.renderer);
    }
    const { scene } = availableComponent;
    this.effectPass = new EffectPass(scene.camera._main, new BloomEffect());
    this.effectPass.renderToScreen = true;
    this.composer.reset();
    this.composer.addPass(new RenderPass(scene.scene, scene.camera._main));
    this.composer.addPass(this.effectPass);
  };

  componentDidMount = () => {};

  init = () => {
    // Try to create WebGL renderer, fallback to a minimal canvas renderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: this.props.antialias,
        shadowMap: true,
        alpha: this.props.alpha,
        preserveDrawingBuffer: true
      });
      this.useWebGL = true;
    } catch (e) {
      console.warn("WebGL not available, using fallback renderer:", e.message);
      this.useWebGL = false;
      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        shadowMap: false,
        alpha: this.props.alpha,
        preserveDrawingBuffer: true,
        powerPreference: "low-power"
      });
    }

    this.canvas = this.renderer.domElement;

    ReactDOM.findDOMNode(this).appendChild(this.canvas);
    document.body.appendChild(this.stats.dom);
    this.setupRendererDefaults();
    this.setupCanvasDefaults();
    this.registerEventListeners();
    this.setState({ ready: true });

    window.THREE = THREE;
    this.onWindowResize();
  };

  update = time => {
    this.stats.begin();
    const { backgroundColor, availableComponent, postprocessing } = this.props;
    const mainCameraReady = availableComponent.scene.camera._main;
    if (this.state.ready && mainCameraReady) {
      if (!postprocessing || !this.useWebGL) {
        this.renderer.render(
          availableComponent.scene.scene,
          availableComponent.scene.camera._main
        );
      } else {
        this.effectPass || this.setPostProcessing();
        this.composer.render(time - this.timePreviousFrame);
      }
      this.timePreviousFrame = time;

      this.renderer.setClearColor(backgroundColor, 0);
    }
    this.stats.end();
  };

  setupCanvasDefaults() {
    this.canvas.parentNode.style.position = "absolute";
    this.canvas.parentElement.style.heigh = "100%";
    this.canvas.parentElement.style.left = 0;
    this.canvas.parentElement.style.top = 0;
    this.canvas.parentElement.style.zIndex = -1;
  }

  setupRendererDefaults() {
    this.renderer.shadowMap.enabled = this.useWebGL;
    if (this.useWebGL) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    this.renderer.setClearColor(0x544c41, 0.9);
    this.renderer.sortObjects = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  registerEventListeners = () => {
    window.addEventListener("resize", this.onWindowResize, false);
  };

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize);
  }

  onWindowResize = event => {
    if (!this.renderer || !this.renderer.domElement.parentElement) {
      return;
    }

    const SCREEN_WIDTH = this.renderer.domElement.parentElement.clientWidth;
    const SCREEN_HEIGHT = this.renderer.domElement.parentElement.clientHeight;
    this.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

    this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.resizeFunctions.forEach(resizeFunction => {
      resizeFunction();
    });
  };

  updateChildren = time => {
    this.updateCallbacksArray.forEach(update => {
      update(time);
    });
  };

  subscribeResize = onResizeFunction => {
    this.resizeFunctions.push(onResizeFunction);
  };

  canvasWidth = () => this.canvas ? this.canvas.width : 0;

  canvasHeight = () => this.canvas ? this.canvas.height : 0;

  getAspect = () => this.aspect;

  render = () => (
    <div
      key="renderer"
      id="renderer"
      className="scene"
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  );
}

Renderer.propTypes = {
  availableWidth: PropTypes.number,
  availableHeight: PropTypes.number,
  assetsLoadState: PropTypes.object
};
