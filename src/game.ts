export enum PlayerAction {
  MOVE_X_POSITIVE,
  MOVE_X_NEGATIVE,
  MOVE_Z_POSITIVE,
  MOVE_Z_NEGATIVE,
  JUMP,
}

export abstract class PlayerController {
  abstract takeAction(state: PlayerState): PlayerAction;
  abstract observeResult(result: TurnResult, reward: number): void;
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
  abstract getReward(result: TurnResult): number;
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
  public readonly rewardPolicy: RewardPolicy;

  private lastTurnResult: TurnResult | undefined;

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
    if (this.lastTurnResult) {
      const reward = this.rewardPolicy.getReward(this.lastTurnResult);
      this.player.controller.observeResult(this.lastTurnResult, reward);
    }

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

    const result: TurnResult = {
      playerAction,
      newPlayerState,
      oldPlayerState,
    };

    this.lastTurnResult = result;

    return result;
  }
}
