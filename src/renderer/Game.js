import React from "react";
import PropTypes from "prop-types"; // ES6

import Renderer from "./RendererContainer";
import Scene from "./Core/Scene/SceneContainer";
import { PhysicsService } from "./Services/PhysicsService";
import { AudioService } from "./Services/AudioService";
import { AnimationService } from "./Services/AnimationService";
import { InputService } from "./Services/InputService";

import * as GameContext from "./GameContext";

export class Game extends React.Component {
  frame = null;

  state = {
    renderer: null,
    scene: null,
    ready: false,
    started: false
  };

  updateCallbacksArray = [];

  availableComponent = {};
  availableService = {};
  totalTimePaused = 0;
  isTabActive = true;
  lastActiveTime = 0;

  addGameService = gameService => {
    if (!gameService) {
      return;
    }
    // console.log(gameService);
    this.setState({ [gameService.props.id]: gameService });
    this.availableService[gameService.props.id] = gameService;
    this.registerUpdate(this.availableService[gameService.props.id].update);
  };

  addGameComponent = (gameComponent, alias) => {
    if (!gameComponent) {
      return;
    }

    const componentPropretyName = alias ? alias : gameComponent.props.id;
    // console.log(gameComponent);
    this.setState({
      [componentPropretyName]: gameComponent
    });
    this.availableComponent[componentPropretyName] = gameComponent;
    this.registerUpdate(this.availableComponent[componentPropretyName].update);
  };

  start = () => {
    const { renderer, scene } = this.state;
    renderer.init();
    scene.init();
    this.setActiveWatcher();
    this.animate(performance.now());
    this.setState({ started: true });
  };

  setActiveWatcher = () => {
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
      false
    );
  };
  handleVisibilityChange = () => {
    if (document.hidden) {
      this.pauseSimulation();
    } else {
      this.startSimulation();
    }
  };

  startSimulation = () => {
    this.isTabActive = true;
    const timeFromLastPause = performance.now() - this.timeStartedPause;
    this.totalTimePaused += timeFromLastPause;
  };

  pauseSimulation = () => {
    this.isTabActive = false;
    this.timeStartedPause = performance.now();
  };

  animate = time => {
    if (this.unmounting) {
      return;
    }

    if (this.isTabActive) {
      const activeTime = time - this.totalTimePaused;
      const deltaTime = activeTime - this.lastActiveTime;
      this.updateChildren(activeTime, deltaTime);
      this.lastActiveTime = activeTime;
    }

    this.frame = requestAnimationFrame(this.animate);
  };

  registerUpdate = update => {
    this.updateCallbacksArray.push(update);
  };

  updateChildren = (time, deltaTime )=> {
    this.updateCallbacksArray.forEach(update => {
      update && update(time, deltaTime);
    });
  };

  componentWillUnmount = () => {
    this.unmounting = true;
    cancelAnimationFrame(this.frame);
    console.log("unmounting scene");
  };

  componentDidUpdate = () => {
    const { scene, renderer, started, ready } = this.state;
    if (!started && ready) {
      this.start();
      return;
    }
    if (!ready && renderer && scene) {
      this.setState({ ready: true });
    }
  };

  render = () => {
    if (this.unmounting) {
      return null;
    }
    // TODO: convert to "react context"
    const _propsList = {
      availableComponent: this.availableComponent,
      availableService: this.availableService,
      game: this,
      loadedCallback: this.props.loadedCallback
    };

    return (
      <GameContext.Provider value={{ ..._propsList }}>
        <Renderer
          {..._propsList}
          ref={this.addGameComponent}
          key="renderer"
          id="renderer"
        />
        <Scene
          {..._propsList}
          ref={this.addGameComponent}
          key="scene"
          id="scene"
        />
        <PhysicsService
          {..._propsList}
          ref={this.addGameService}
          key="physics"
          id="physics"
        />
        <AudioService
          {..._propsList}
          ref={this.addGameService}
          key="audio"
          id="audio"
        />
        <AnimationService
          {..._propsList}
          ref={this.addGameService}
          key="animation"
          id="animation"
        />
        <InputService ref={this.addGameService} key="input" id="input" />
      </GameContext.Provider>
    );
  };
}

Game.propTypes = {
  loadedCallback: PropTypes.func
};
