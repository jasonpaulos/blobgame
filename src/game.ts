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
}

export interface Player {
  controller: PlayerController;
  state: PlayerState;
}

export abstract class RewardPolicy {
  abstract getReward(result: TurnResultWithoutReward): number;
}

export interface TurnResultWithoutReward {
  playerAction: PlayerAction;
  oldPlayerState: PlayerState;
  newPlayerState: PlayerState;
}

export interface TurnResult extends TurnResultWithoutReward {
  playerReward: number;
}

export class Game {
  public readonly gridLengthX: number;
  public readonly gridLengthZ: number;

  public readonly player: Player;
  public readonly rewardPolicy: RewardPolicy;

  constructor({
    gridLengthX,
    gridLengthZ,
    player,
    rewardPolicy,
  }: {
    gridLengthX: number;
    gridLengthZ: number;
    player: Player;
    rewardPolicy: RewardPolicy;
  }) {
    this.gridLengthX = gridLengthX;
    this.gridLengthZ = gridLengthZ;
    this.player = player;
    this.rewardPolicy = rewardPolicy;
  }

  public takeTurn(): TurnResult {
    const playerAction = this.player.controller.takeAction(this.player.state);

    const oldPlayerState = this.player.state;
    const newPlayerState: PlayerState = {
      xPosition: oldPlayerState.xPosition,
      zPosition: oldPlayerState.zPosition,
    };

    switch (playerAction) {
      case PlayerAction.MOVE_X_POSITIVE:
        if (newPlayerState.xPosition < this.gridLengthX - 1) {
          newPlayerState.xPosition += 1;
        }
        break;
      case PlayerAction.MOVE_X_NEGATIVE:
        if (newPlayerState.xPosition > 0) {
          newPlayerState.xPosition -= 1;
        }
        break;
      case PlayerAction.MOVE_Z_POSITIVE:
        if (newPlayerState.zPosition < this.gridLengthZ - 1) {
          newPlayerState.zPosition += 1;
        }
        break;
      case PlayerAction.MOVE_Z_NEGATIVE:
        if (newPlayerState.zPosition > 0) {
          newPlayerState.zPosition -= 1;
        }
        break;
      case PlayerAction.JUMP:
        if (
          newPlayerState.xPosition === Math.floor(this.gridLengthX / 2) &&
          newPlayerState.zPosition === Math.floor(this.gridLengthZ / 2)
        )
          break;
    }

    this.player.state = newPlayerState;

    const resultWithoutReward: TurnResultWithoutReward = {
      playerAction,
      newPlayerState,
      oldPlayerState,
    };

    const playerReward = this.rewardPolicy.getReward(resultWithoutReward);

    const result: TurnResult = {
      ...resultWithoutReward,
      playerReward,
    };

    this.player.controller.observeResult(result);

    return result;
  }
}
