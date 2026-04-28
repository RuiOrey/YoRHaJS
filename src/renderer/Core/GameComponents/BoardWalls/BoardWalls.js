import React from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import * as CANNON from "cannon";

export class BoardWalls extends React.Component {
  walls = [];

  width = this.props.width || 100;
  height = this.props.height || 100;
  wallThickness = this.props.wallThickness || 2;

  start = () => {
    const { transform, gameObject, availableService } = this.props;
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const wallHeight = this.height + this.wallThickness * 2;
    const wallWidth = this.width + this.wallThickness * 2;

    // Collision filter group for walls (blocks both player and enemies)
    const wallCollisionGroup = 2;

    // Top wall
    this.createWall(
      availableService,
      gameObject,
      { x: 0, y: halfHeight + this.wallThickness / 2, z: 0 },
      { x: wallWidth, y: this.wallThickness, z: this.wallThickness },
      wallCollisionGroup
    );

    // Bottom wall
    this.createWall(
      availableService,
      gameObject,
      { x: 0, y: -(halfHeight + this.wallThickness / 2), z: 0 },
      { x: wallWidth, y: this.wallThickness, z: this.wallThickness },
      wallCollisionGroup
    );

    // Left wall
    this.createWall(
      availableService,
      gameObject,
      { x: -(halfWidth + this.wallThickness / 2), y: 0, z: 0 },
      { x: this.wallThickness, y: wallHeight, z: this.wallThickness },
      wallCollisionGroup
    );

    // Right wall
    this.createWall(
      availableService,
      gameObject,
      { x: halfWidth + this.wallThickness / 2, y: 0, z: 0 },
      { x: this.wallThickness, y: wallHeight, z: this.wallThickness },
      wallCollisionGroup
    );
  };

  createWall = (availableService, gameObject, position, dimensions, collisionGroup) => {
    const wallTransform = new THREE.Object3D();
    wallTransform.userData.belongsToGameObject = true;
    wallTransform.position.set(position.x, position.y, position.z);

    const wallResult = availableService.physics.addNewBoxBody(
      wallTransform,
      {
        mass: 0,
        position: position,
        dimensions: dimensions,
        collisionFilterGroup: collisionGroup,
        collisionFilterMask: -1,
        type: "static"
      },
      this
    );

    this.walls.push(wallResult);
  };

  update = () => {};

  onDestroy = () => {
    const { availableService } = this.props;
    this.walls.forEach(wall => {
      if (wall.body) {
        availableService.physics.toRemoveBodies.push(wall.body);
      }
    });
    this.walls = [];
  };

  render() {
    return null;
  }
}

BoardWalls.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  wallThickness: PropTypes.number
};
