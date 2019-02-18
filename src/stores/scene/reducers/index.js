import { initialState } from "../../initialState";
import * as _ from 'lodash';

export const mainReducer = (state = initialState, action) => {
  let _oldAssetLoadState;
  let reducerStorageTemporaryObject = {};
  let assetsLoadState;
  const {gameObjectId, prefabId, newId, transform, parentId} = action;
  switch (action.type) {
    case "UPDATE_SCENE_PARAMETERS":
      return {
        ...state,
        ...action.parametersObject,
      };
    case "EMIT_LOADING_ASSET":
      _oldAssetLoadState = state.assetsLoadState ? state.assetsLoadState : {};
      assetsLoadState = {
        ..._oldAssetLoadState,
        [action.filename]: action.total,
      };
      return {
        ...state,
        assetsLoadState,
      };
      // TODO: refactor this and prefab as they share same logic with var name changes (attention to newId)
      // TODO FIRST: restructure state so we don't need this quantity of nesting
    case "INSTANTIATE_FROM_GO":
      reducerStorageTemporaryObject.state = state;
      reducerStorageTemporaryObject.scene = state.game.scene;
      reducerStorageTemporaryObject.gameObjects = reducerStorageTemporaryObject.scene.gameObjects.byId;
      if (gameObjectId) {
        reducerStorageTemporaryObject.gameObjectToClone = _.cloneDeep( reducerStorageTemporaryObject.gameObjects[gameObjectId]);
        if (transform) {
          reducerStorageTemporaryObject.gameObjectToClone.transform = {...reducerStorageTemporaryObject.gameObjects[gameObjectId].transform, ...transform};
        }
        reducerStorageTemporaryObject.newId = _.uniqueId(gameObjectId);
        reducerStorageTemporaryObject.state = {
          ...reducerStorageTemporaryObject.state,
          game: {
            ...reducerStorageTemporaryObject.state.game,
            scene: {
              ...reducerStorageTemporaryObject.state.game.scene,
              gameObjects: {
                byId: {
                    ...reducerStorageTemporaryObject.state.game.scene.gameObjects.byId,
                  [reducerStorageTemporaryObject.newId] : reducerStorageTemporaryObject.gameObjectToClone
                },
                allIds: [...reducerStorageTemporaryObject.state.game.scene.gameObjects.allIds, reducerStorageTemporaryObject.newId]
              },
            }
          }
        };
        if (parentId) {
          reducerStorageTemporaryObject.parent = reducerStorageTemporaryObject.state.game.scene.gameObjects.byId[parentId];
          const _currentChildren = reducerStorageTemporaryObject.parent.children || [];
          reducerStorageTemporaryObject.parent.children= [..._currentChildren, reducerStorageTemporaryObject.newId  ];
        }
        else {
           reducerStorageTemporaryObject.state.game.scene.children = [...reducerStorageTemporaryObject.state.game.scene.children, reducerStorageTemporaryObject.newId]
        }
      }
      return reducerStorageTemporaryObject.state;
      /*
      {
        type: 'INSTANTIATE_FROM_GO',
        gameObjectId:"testShooter1",
        transform: {position: {x:0,y:0,z:10}}
      }
      {
        type: 'INSTANTIATE_FROM_GO',
        gameObjectId:"testCubeGameObject1",
        transform: {position: {x:0,y:0,z:10}},
        parentId: "testShooter1"
      }
       */
    case "INSTANTIATE_FROM_PREFAB":
      reducerStorageTemporaryObject.state = state;
      reducerStorageTemporaryObject.scene = state.game.scene;
      reducerStorageTemporaryObject.gameObjects = reducerStorageTemporaryObject.scene.gameObjects.byId;
      if (prefabId && newId) {
          reducerStorageTemporaryObject.newGameObject = {
            debug:true,
            prefab:prefabId,
            transform
          },
          reducerStorageTemporaryObject.state = {
            ...reducerStorageTemporaryObject.state,
            game: {
              ...reducerStorageTemporaryObject.state.game,
              scene: {
                ...reducerStorageTemporaryObject.state.game.scene,
                gameObjects: {
                  byId: {
                    ...reducerStorageTemporaryObject.state.game.scene.gameObjects.byId,
                    [newId] : reducerStorageTemporaryObject.newGameObject
                  },
                  allIds: [...reducerStorageTemporaryObject.state.game.scene.gameObjects.allIds, newId]
                },
              }
            }
          };
          if (parentId) {
            reducerStorageTemporaryObject.parent = reducerStorageTemporaryObject.state.game.scene.gameObjects.byId[parentId];
            const _currentChildren = reducerStorageTemporaryObject.parent.children || [];
            reducerStorageTemporaryObject.parent.children= [..._currentChildren, newId  ];
          }
          else {
            reducerStorageTemporaryObject.state.game.scene.children = [...reducerStorageTemporaryObject.state.game.scene.children, newId]
          }
        }
      return reducerStorageTemporaryObject.state;
      /*
         {
        type: 'INSTANTIATE_FROM_PREFAB',
        prefabId:"TestCube",
        transform: {position: {x:0,y:0,z:10}},
        parentId: "testShooter1",
        newId: "teste"
      }
       */
    default:
      return state;
  }
};
