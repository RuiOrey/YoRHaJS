import React, { Component } from "react";
// import logo from './logo.svg';

import logo from "./yorha-black.png";
import "./App.css";
import YoRHa from "./game/YoRHa";


import { createStore } from "redux";
import { Provider } from "react-redux";
import rootReducer from "./new_renderer_stores";
import {Game} from "./new_renderer_gameobject/Game";

const store = createStore(
    rootReducer /* preloadedState, */,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
);

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Glory to Mankind</h1>
          {/*<h2></h2>*/}
        </header>
        <p className="App-intro">Hacking mini game </p>
        {/*<YoRHa />*/}
          <Provider store={store}>
            <Game key={"game"}/>
          </Provider>
      </div>
    );
  }
}

export default App;
