import React from "react";
import PropTypes from "prop-types";

import * as THREE from "three";

// TODO: split into components to travel, create geometry, play sound, self destroy, etc (take init functions as hints)
export class PlayerBulletGeometry extends React.Component {
  cube;

  initBulletGeometry = () => {
    const { transform, color, emissive, opacity } = this.props;
    const bulletColor = color !== undefined ? color : 0x88ccff;
    const bulletEmissive = emissive !== undefined ? emissive : 0x4488aa;

    const geometry = new THREE.BoxGeometry(1, 3, 1);
    const material = new THREE.MeshPhongMaterial({
      color: bulletColor,
      emissive: bulletEmissive,
    });

    if (opacity !== undefined) {
      material.opacity = opacity;
      material.transparent = true;
    }

    this.cube = new THREE.Mesh(geometry, material);
    transform.add(this.cube);
  };


  start = () => {
    this.initBulletGeometry();
  };

  render() {
    return null;
  }
}

PlayerBulletGeometry.propTypes = {
  transform: PropTypes.object.isRequired,
  color: PropTypes.number,
  emissive: PropTypes.number,
  emissiveIntensity: PropTypes.number,
  opacity: PropTypes.number
};
