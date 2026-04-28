import React from "react";
import PropTypes from "prop-types";

export class Health extends React.Component {
  maxHealth = this.props.maxHealth || 100;
  currentHealth = this.props.currentHealth !== undefined ? this.props.currentHealth : 100;
  damageReduction = this.props.damageReduction || 0;

  isDeadFlag = false;

  takeDamage = (amount) => {
    if (this.isDeadFlag) {
      return;
    }

    const reducedDamage = Math.max(0, amount - this.damageReduction);
    this.currentHealth = Math.max(0, this.currentHealth - reducedDamage);

    // Update health in Redux state
    this.props.updateSelf({
      currentHealth: this.currentHealth
    });

    if (this.currentHealth <= 0 && !this.isDeadFlag) {
      this.isDeadFlag = true;
      this.onDeath();
    }
  };

  heal = (amount) => {
    if (this.isDeadFlag) {
      return;
    }

    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);

    // Update health in Redux state
    this.props.updateSelf({
      currentHealth: this.currentHealth
    });
  };

  isDead = () => {
    return this.currentHealth <= 0 || this.isDeadFlag;
  };

  onDeath = () => {
    const { gameObject, updateSelf } = this.props;
    const gameObjectId = gameObject.id;
    const tags = gameObject._tags || [];

    // Ensure currentHealth is 0 in Redux
    updateSelf({
      currentHealth: 0
    });

    // Dispatch custom event for other components to listen
    const event = new CustomEvent("gameobject_died", {
      detail: {
        gameObjectId: gameObjectId,
        tags: tags
      }
    });
    document.dispatchEvent(event);
  };

  start = () => {
    // Sync initial health to Redux if different from default
    if (this.props.currentHealth !== undefined) {
      this.currentHealth = this.props.currentHealth;
    }
  };

  update = () => {};

  render() {
    return null;
  }
}

Health.propTypes = {
  maxHealth: PropTypes.number,
  currentHealth: PropTypes.number,
  damageReduction: PropTypes.number
};
