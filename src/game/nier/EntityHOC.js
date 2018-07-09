import React, {Component} from 'react';

import * as THREE from 'three';

export function makeEntity( WrappedComponent )
  {
    return class extends React.Component {

      pivot = new THREE.Object3D();
      components = [];

      componentWillMount = () => {
        if ( this.props.transform && this.props.transform.position )
          {
            this.pivot.position.set( ...this.props.transform.position );
          }
      };

      componentWillReceiveProps( nextProps )
        {
          console.log( 'Current props: ', this.props );
          console.log( 'Next props: ', nextProps );
        }

      registerComponent = ( component ) => {
        this.components.push( component );
      };

      _update = () => {
        this.components.forEach( component => component.update() );
      };

      render()
        {
          const {transform, ...passThroughProps} = this.props;
          // Wraps the input component in a container, without mutating it. Good!
          return <WrappedComponent
              {...passThroughProps} pivot={this.pivot}
              registerComponent={this.registerComponent}/>;
        }
    };
  }