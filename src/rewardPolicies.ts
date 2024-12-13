import { RewardPolicy, TurnResultWithoutReward, PlayerAction } from "./game";

export class AutoRewardPolicy extends RewardPolicy {
  public getReward(result: TurnResultWithoutReward): number {
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
