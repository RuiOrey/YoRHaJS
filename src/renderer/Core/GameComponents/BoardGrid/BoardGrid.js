import React from "react";
import PropTypes from "prop-types";
import * as THREE from "three";

export class BoardGrid extends React.Component {
  gridHelper;

  size = this.props.size || 100;
  divisions = this.props.divisions || 20;
  colorCenterLine = this.props.colorCenterLine || 0x444444;
  colorGrid = this.props.colorGrid || 0x888888;

  start = () => {
    const { transform } = this.props;

    this.gridHelper = new THREE.GridHelper(
      this.size,
      this.divisions,
      this.colorCenterLine,
      this.colorGrid
    );

    // Position slightly above board surface to avoid z-fighting
    this.gridHelper.position.z = 0.1;

    transform.add(this.gridHelper);
  };

  update = () => {};

  onDestroy = () => {
    if (this.gridHelper) {
      const { transform } = this.props;
      transform.remove(this.gridHelper);
      this.gridHelper = null;
    }
  };

  render() {
    return null;
  }
}

BoardGrid.propTypes = {
  size: PropTypes.number,
  divisions: PropTypes.number,
  colorCenterLine: PropTypes.number,
  colorGrid: PropTypes.number
};
