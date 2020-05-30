import React from "react";
import PropTypes from "prop-types";

import * as THREE from "three";

// import OBJLoader from "three-obj-loader";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const FBXLoader = require("three-fbx-loader");

export class OBJMeshGeometry extends React.Component {
  transform = new THREE.Object3D();
  modelToUse;

  //TODO: export this to a generic acessible enum
  materialTypes = {
    basic: THREE.MeshBasicMaterial,
    standard: THREE.MeshStandardMaterial
  };

  materialType = "basic";
  materialToUse;
  materialInstance;

  modelLoadedCallback = loadedModel => {
    const {transform, scale, materialType, materialParameters } = this.props;
    this.modelToUse = loadedModel.children[0];

    this.modelToUse.rotateX(Math.PI/2);
    console.log(this);

    // this.transform.add(modelToUse);
    transform.add(this.modelToUse);

    if (scale) {
      this.modelToUse.scale.set(scale,scale,scale);
    }

    if (materialType || materialParameters) {
    this.materialType = materialType || this.materialType;
    this.materialToUse = this.materialTypes[this.materialType];
    this.materialInstance = new this.materialToUse(materialParameters) ;

    this.modelToUse.material = this.materialInstance;
    this.modelToUse.material.needsUpdate = true;
    }

    return;
  };

  _loadFBX = assetURL => {
    const loader = new FBXLoader();
    loader.load(assetURL, this.modelLoadedCallback);
  };

  _loadOBJ = assetURL => {
    const loader = new OBJLoader();
    loader.load(assetURL, this.modelLoadedCallback);
  };

  loadModel = () => {
    const { modelInputData, assetURL } = this.props;
    const splittedUrl = assetURL.split(".");
    const extension = splittedUrl[splittedUrl.length - 1];

    switch (extension) {
      case "fbx":
        this._loadFBX(assetURL);
        break;
      case "obj":
        this._loadOBJ(assetURL);
        break;
      default:
        this._loadOBJ(assetURL);
    }
  };

  start = () => {
    const { transform } = this.props;
    this.loadModel();
    transform.add(this.transform);
  };

  update = () => {};

  render() {
    return null;
  }
}

OBJMeshGeometry.propTypes = {
  assetURL: PropTypes.string.isRequired,
  scale: PropTypes.number,
  materialParameters:PropTypes.object,
  materialType:PropTypes.string
};
