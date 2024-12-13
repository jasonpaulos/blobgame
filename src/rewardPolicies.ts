import { RewardPolicy, TurnResult, PlayerAction } from "./game";

export class AutoRewardPolicy extends RewardPolicy {
  public getReward(result: TurnResult): number {
    const { playerAction, oldPlayerState, newPlayerState } = result;
    if (
      playerAction === PlayerAction.JUMP &&
      newPlayerState.xPosition === 0 &&
      newPlayerState.zPosition === 0
    ) {
      return 1;
    }
    return 0;
  }
}

export class ManualRewardPolicy extends RewardPolicy {
  private reward: number = 0;

  public setReward(value: number) {
    this.reward = value;
  }

  public getReward(result: TurnResult): number {
    return this.reward;
  }
}
