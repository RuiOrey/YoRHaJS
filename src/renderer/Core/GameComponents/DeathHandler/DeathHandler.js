import React from "react";
import PropTypes from "prop-types";

export class DeathHandler extends React.Component {
  deathEffect = this.props.deathEffect || null;
  soundOnDeath = this.props.soundOnDeath || null;
  hasDied = false;

  deathEventListener = null;

  start = () => {
    const { gameObject } = this.props;
    const gameObjectId = gameObject.id;

    // Listen for gameobject_died custom event
    this.deathEventListener = (event) => {
      if (event.detail && event.detail.gameObjectId === gameObjectId) {
        this.handleDeath();
      }
    };
    document.addEventListener("gameobject_died", this.deathEventListener);
  };

  handleDeath = () => {
    if (this.hasDied) {
      return;
    }
    this.hasDied = true;

    const { transform, gameObject, availableService, destroyGameObjectById } = this.props;

    // Trigger death effect placeholder
    if (this.deathEffect) {
      this.triggerDeathEffect();
    }

    // Play death sound placeholder
    if (this.soundOnDeath) {
      this.playDeathSound();
    }

    // Hide mesh
    transform.visible = false;

    // Remove physics body
    if (availableService && availableService.physics) {
      availableService.physics.purgeTransformOfEventualBodies(transform);
    }

    // Dispatch Redux destroy action
    destroyGameObjectById(gameObject.id);
  };

  triggerDeathEffect = () => {
    // Placeholder for future explosion/VFX
    // TODO: implement particle effects, screen shake, etc.
  };

  playDeathSound = () => {
    // Placeholder for future SFX
    // TODO: implement death sound playback
    const { availableService, transform } = this.props;
    if (availableService && availableService.audio) {
      // Future: availableService.audio.play(this.soundOnDeath);
    }
  };

  update = (time, deltaTime) => {
    // Also check Health component in update loop as fallback
    if (this.hasDied) {
      return;
    }

    const { gameObject } = this.props;
    const healthComponent = gameObject.getComponent("health");

    if (healthComponent && typeof healthComponent.isDead === "function") {
      if (healthComponent.isDead()) {
        this.handleDeath();
      }
    }
  };

  onDestroy = () => {
    if (this.deathEventListener) {
      document.removeEventListener("gameobject_died", this.deathEventListener);
      this.deathEventListener = null;
    }
  };

  render() {
    return null;
  }
}

DeathHandler.propTypes = {
  deathEffect: PropTypes.string,
  soundOnDeath: PropTypes.string
};
