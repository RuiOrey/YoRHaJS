import React from "react";
import * as _ from "lodash";
import { Vector3 } from "three";
import {
  instantiateFromPrefab,
  updateGameObject,
  updateGameObjectComponent
} from "../../../../stores/scene/actions";

export class Shooter extends React.Component {
  shootTimeInterval = this.props.shootTimeInterval || 100;
  selfDestructTime = this.props.selfDestructTime || 2000;

  // new shoot logic
  bulletId = 0;
  shooting = this.props.shooting || false;
  shootingStartTime = null;
  updateTime = null;
  type = this.props.type || "forward";
  bulletPrefab = this.props.bulletPrefab || "PlayerBullet";
  bulletComponentNameFromPrefabName = {
    EnemyBullet: "enemyBulletGeometry",
    PlayerBullet: "playerBulletGeometry"
  };
  bulletComponentName = this.bulletComponentNameFromPrefabName[
    this.bulletPrefab
  ];

  availableBullets = [];
  movingBullets = [];

  state = {};

  announceAvailableBullet = bulletGameObject => {
    this.availableBullets.unshift(bulletGameObject);
    this.movingBullets = this.movingBullets.filter(
      bullet => bullet !== bulletGameObject
    );
  };

  shootForwardBulletFromAvailableBullets = time => {};

  shootForwardBullet = time => {
    // compute how many bullets to shoot now to catch up time step
    const totalShotBulletsTime = this.bulletId * this.shootTimeInterval;
    const timePassedFromLastShot =
      time - (this.shootingStartTime + totalShotBulletsTime);
    const bulletsToShootNow = Math.floor(
      timePassedFromLastShot / this.shootTimeInterval
    );

    for (let bulletIndex = 1; bulletIndex <= bulletsToShootNow; bulletIndex++) {
      const startTimeForThisBullet =
        this.shootingStartTime +
        totalShotBulletsTime +
        bulletIndex * this.shootTimeInterval;

      const { transform, selfSettings, availableComponent } = this.props;
      const { scene } = availableComponent;
      const { moveRatio, displacementRatio } = selfSettings;
      const { position, rotation, scale } = transform;
      const bullet = this.availableBullets.pop();
      this.movingBullets.push(bullet);
      const currentBulletId = bullet.props.id;
      const currentBulletGameObjectId = bullet.props.gameObject.id;

      this.playBulletSound();
      scene.enqueueAction(
        updateGameObjectComponent(currentBulletGameObjectId, currentBulletId, {
          initTime: startTimeForThisBullet,
          bulletIndex,
          moveRatio,
          displacementRatio
          // shooterId: gameObject.id,
          // shooterTag: gameObject._tags[0],
        })
      );
      scene.enqueueAction(
        updateGameObject(currentBulletGameObjectId, {
          transform: {
            position: position.clone(),
            rotation: rotation.clone(),
            scale: scale.clone()
          }
        })
      );
    }

    // total new bullets
    this.bulletId += bulletsToShootNow;
  };

  initForwardBullets = () => {
    const bulletsToInit = Math.floor(
      this.selfDestructTime / this.shootTimeInterval
    );

    for (let bulletIndex = 1; bulletIndex <= bulletsToInit + 1; bulletIndex++) {
      const startTimeForThisBullet = -1;

      const {
        transform,
        selfSettings,
        availableComponent,
        gameObject
      } = this.props;
      const { scene } = availableComponent;
      const { moveRatio, displacementRatio } = selfSettings;
      const { position, rotation, scale } = transform;
      const currentBulletId = _.uniqueId(this.bulletPrefab);
      scene.enqueueAction(
        instantiateFromPrefab(
          this.bulletPrefab,
          currentBulletId,
          {
            position,
            rotation,
            scale
          },
          null,
          null,
          {
            [this.bulletComponentName]: {
              initTime: startTimeForThisBullet,
              bulletIndex,
              moveRatio,
              displacementRatio,
              shooterId: gameObject.id,
              shooterTag: gameObject._tags[0],
              shooterComponentId: this.props.id
            }
          }
        )
      );
      // this.playBulletSound();
    }

    // total new bullets
    this.bulletId += bulletsToInit;
  };

  shootAroundBullet = time => {
    // compute how many bullets to shoot now to catch up time step
    const totalShotBulletsTime = this.bulletId * this.shootTimeInterval;
    const timePassedFromLastShot =
      time - (this.shootingStartTime + totalShotBulletsTime);
    const bulletsToShootNow = Math.floor(
      timePassedFromLastShot / this.shootTimeInterval
    );

    for (let bulletIndex = 1; bulletIndex <= bulletsToShootNow; bulletIndex++) {
      const startTimeForThisBullet =
        this.shootingStartTime +
        totalShotBulletsTime +
        bulletIndex * this.shootTimeInterval;

      const {
        // batchInstantiateFromPrefab,
        transform,
        selfSettings
      } = this.props;
      const { moveRatio, displacementRatio, aroundBullets } = selfSettings;
      const { position, rotation, scale } = transform;

      const { availableComponent } = this.props;
      const { scene } = availableComponent;

      const angleChange = (2 * Math.PI) / aroundBullets;

      const bulletInstantiationPayload = [];

      for (let i = 0; i < aroundBullets; i++) {
        const currentBulletId = _.uniqueId(this.bulletPrefab);

        const _rotation = rotation.clone();
        // _rotation.z += angleChange * i;
        _rotation._z = rotation._z + angleChange * i;
        const payload = [
          this.bulletPrefab,
          currentBulletId,
          {
            position,
            rotation: _rotation,
            scale
          },
          null,
          null,
          {
            [this.bulletComponentName]: {
              initTime: startTimeForThisBullet,
              bulletIndex,
              moveRatio,
              displacementRatio
            }
          }
        ];
        // bulletInstantiationPayload.push(payload);

        scene.enqueueAction(instantiateFromPrefab(...payload));
      }
      //batchInstantiateFromPrefab(bulletInstantiationPayload);
      this.playBulletSound();
    }

    // total new bullets
    this.bulletId += bulletsToShootNow;
  };

  shootFunction = {
    around: this.shootAroundBullet,
    forward: this.shootForwardBullet
  };

  initBulletsFunction = {
    // around: this.shootAroundBullet,
    around: () => {},
    forward: this.initForwardBullets
  };

  startShooting = () => {
    if (this.shooting) {
      return;
    }
    this.shooting = true;
    this.bulletId = 0;
    this.shootingStartTime = this.updateTime;
  };

  stopShooting = () => {
    this.shooting = false;
  };

  playBulletSound = () => {
    if (!this.sound) {
      return;
    }
    setTimeout(() => {
      // eslint-disable-next-line no-unused-expressions
      this.sound.isPlaying ? this.sound.stop() : null;
      this.sound.play();
    }, 50);
  };

  initSound = () => {
    const { transform, availableService, selfSettings } = this.props;
    if (!selfSettings.soundLocation) {
      return;
    }
    const _sound = availableService.audio.buildPositionalSound(
      selfSettings.soundLocation
    );
    _sound.setLoop(false);
    _sound.loop = false;
    transform.add(_sound);
    if (_sound.isPlaying) {
      _sound.stop();
    }
    this.sound = _sound;
  };

  start = () => {
    this.initSound();
    this.initBulletsFunction[this.type]();
  };

  update = time => {
    this.updateTime = time;
    if (this.shooting) {
      this.shootFunction[this.type](time);
    }
  };

  onDestroy = () => {
    this.stopShooting();
  };

  render = () => null;
}
