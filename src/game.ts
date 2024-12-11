export enum PlayerAction {
  MOVE_X_POSITIVE,
  MOVE_X_NEGATIVE,
  MOVE_Z_POSITIVE,
  MOVE_Z_NEGATIVE,
  JUMP,
}

export abstract class PlayerController {
  abstract takeAction(state: PlayerState): PlayerAction;
  abstract observeResult(result: TurnResult): void;
}

export interface PlayerState {
  xPosition: number;
  zPosition: number;
  points: number;
}

export interface Player {
  controller: PlayerController;
  state: PlayerState;
}

export interface TurnResult {
  playerAction: PlayerAction;
  oldPlayerState: PlayerState;
  newPlayerState: PlayerState;
}

export class Game {
  public readonly gridLengthX: number;
  public readonly gridLengthZ: number;

  public readonly player: Player;

  constructor({
    gridLengthX,
    gridLengthZ,
    player,
  }: {
    gridLengthX: number;
    gridLengthZ: number;
    player: Player;
  }) {
    this.gridLengthX = gridLengthX;
    this.gridLengthZ = gridLengthZ;
    this.player = player;
  }

  public takeTurn(): TurnResult {
    const playerAction = this.player.controller.takeAction(this.player.state);

    const oldPlayerState = this.player.state;
    const newPlayerState: PlayerState = {
      xPosition: oldPlayerState.xPosition,
      zPosition: oldPlayerState.zPosition,
      points: oldPlayerState.points,
    };

    switch (playerAction) {
      case PlayerAction.MOVE_X_POSITIVE:
        if (newPlayerState.xPosition < this.gridLengthX - 1) {
          newPlayerState.xPosition += 1;
        } else {
          newPlayerState.points -= 10;
        }
        break;
      case PlayerAction.MOVE_X_NEGATIVE:
        if (newPlayerState.xPosition > 0) {
          newPlayerState.xPosition -= 1;
        } else {
          newPlayerState.points -= 10;
        }
        break;
      case PlayerAction.MOVE_Z_POSITIVE:
        if (newPlayerState.zPosition < this.gridLengthZ - 1) {
          newPlayerState.zPosition += 1;
        } else {
          newPlayerState.points -= 10;
        }
        break;
      case PlayerAction.MOVE_Z_NEGATIVE:
        if (newPlayerState.zPosition > 0) {
          newPlayerState.zPosition -= 1;
        } else {
          newPlayerState.points -= 10;
        }
        break;
      case PlayerAction.JUMP:
        if (
          newPlayerState.xPosition === Math.floor(this.gridLengthX / 2) &&
          newPlayerState.zPosition === Math.floor(this.gridLengthZ / 2)
        ) {
          newPlayerState.points += 100;
        }
        break;
    }

    if (newPlayerState.points === oldPlayerState.points) {
      newPlayerState.points -= 1;
    }

    this.player.state = newPlayerState;

    const result: TurnResult = {
      playerAction,
      newPlayerState,
      oldPlayerState,
    };

    this.player.controller.observeResult(result);

    return result;
  }
}
