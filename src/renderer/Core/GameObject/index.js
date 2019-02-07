import { connect } from "react-redux";
import { GameObject } from "./GameObject";

const getGameObjects = (state) => {
    // console.log("child test0",state.mainReducer.game.scene.gameObjects);
    return state.mainReducer.game.scene.gameObjects;
}

const getSelf = (state,id) => {
  return state.mainReducer.game.scene.gameObjects.byId[id];
}

const getPrefabs = (state) => {
  return state.mainReducer.engine.prefabs;
}

const mapStateToProps = (state,props) => ({
    ...props,
    objects: getGameObjects(state),
    selfSettings: getSelf(state,props.id),
    transform: getSelf(state,props.id) ? getSelf(state,props.id).transform : undefined,
    debug: getSelf(state,props.id) ? getSelf(state,props.id).debug : undefined,
    prefabs: getPrefabs(state,props.id),
    // ...state.mainReducer.game.scene,
});

const mapDispatchToProps = (dispatch) => ({
    // TODO : add here dispatch to use Instatiate https://docs.unity3d.com/ScriptReference/Object.Instantiate.html
 });

export default connect(
      mapStateToProps,
      // mapDispatchToProps,
     null,
      null,
      { withRef: true },
  )(GameObject);

//
// const _gameObjects = {
//   lightGroup: makeGameObject(LightGroupContainer, "lightGroup"),
//   default: makeGameObject(EmptyGameObject, "default"),
//   shoe: makeGameObject(ShoeModelContainer, "shoe"),
//   shoeGroup: makeGameObject(ShoeGroup, "shoeGroup"),
// };