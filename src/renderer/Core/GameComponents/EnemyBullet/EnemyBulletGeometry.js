import React from "react";
import PropTypes from "prop-types";

import * as THREE from "three";

export class EnemyBulletGeometry extends React.Component {
  mesh;

  initBulletGeometry = () => {
    const { transform, color, radius, opacity } = this.props;
    const bulletColor = color !== undefined ? color : 0xff4444;
    const bulletRadius = radius || 0.5;
    const emissive = bulletColor;

    const geometry = new THREE.SphereGeometry(bulletRadius, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: bulletColor,
      emissive: emissive,
    });

    if (opacity !== undefined) {
      material.opacity = opacity;
      material.transparent = true;
    }

    this.mesh = new THREE.Mesh(geometry, material);
    transform.add(this.mesh);
  };

  start = () => {
    this.initBulletGeometry();
  };

  render() {
    return null;
  }
}

EnemyBulletGeometry.propTypes = {
  transform: PropTypes.object.isRequired,
  color: PropTypes.number,
  radius: PropTypes.number,
  emissiveIntensity: PropTypes.number,
  opacity: PropTypes.number
};
