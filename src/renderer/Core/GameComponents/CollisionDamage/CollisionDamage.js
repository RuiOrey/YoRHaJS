import React from "react";
import PropTypes from "prop-types";

export class CollisionDamage extends React.Component {
  damageAmount = this.props.damageAmount || 10;
  targetTags = this.props.targetTags || [];
  sourceTags = this.props.sourceTags || [];

  start = () => {
    const { transform } = this.props;

    if (!transform.physicsBody) {
      console.warn("CollisionDamage: No physics body found on transform");
      return;
    }

    // Register beginContactFunction on the physics body
    transform.physicsBody.beginContactFunction = this.handleCollision;
  };

  handleCollision = (otherBody) => {
    const { availableComponent, gameObject } = this.props;
    const { scene } = availableComponent;

    if (!otherBody || !otherBody.mesh) {
      return;
    }

    const otherGameObject = otherBody.mesh.gameObject;
    if (!otherGameObject) {
      return;
    }

    const otherTags = otherGameObject._tags || [];

    // Check if the other object has matching target tags
    const hasMatchingTag = this.targetTags.some(targetTag =>
      otherTags.includes(targetTag)
    );

    if (!hasMatchingTag) {
      return;
    }

    // Check if this object has matching source tags (if sourceTags is specified)
    if (this.sourceTags.length > 0) {
      const thisTags = gameObject._tags || [];
      const hasMatchingSourceTag = this.sourceTags.some(sourceTag =>
        thisTags.includes(sourceTag)
      );

      if (!hasMatchingSourceTag) {
        return;
      }
    }

    // Find Health component on the target GameObject
    const healthComponent = otherGameObject.getComponent("health");
    if (healthComponent && typeof healthComponent.takeDamage === "function") {
      healthComponent.takeDamage(this.damageAmount);
    }
  };

  update = () => {};

  onDestroy = () => {
    const { transform } = this.props;
    if (transform && transform.physicsBody) {
      transform.physicsBody.beginContactFunction = null;
    }
  };

  render() {
    return null;
  }
}

CollisionDamage.propTypes = {
  damageAmount: PropTypes.number,
  targetTags: PropTypes.arrayOf(PropTypes.string),
  sourceTags: PropTypes.arrayOf(PropTypes.string)
};
