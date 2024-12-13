import { RewardPolicy, TurnResult, PlayerAction } from "./game";

export class AutoRewardPolicy extends RewardPolicy {
  private sequenceLength: number = 0;

  private readonly centerPosition = 3;

  private readonly targetSequence: [number, number][] = [
    [this.centerPosition + 1, this.centerPosition],
    [this.centerPosition + 1, this.centerPosition + 1],
    [this.centerPosition, this.centerPosition + 1],
    [this.centerPosition - 1, this.centerPosition + 1],
    [this.centerPosition - 1, this.centerPosition],
    [this.centerPosition - 1, this.centerPosition - 1],
    [this.centerPosition, this.centerPosition - 1],
    [this.centerPosition + 1, this.centerPosition - 1],
  ];

  private sequenceIndex(x: number, z: number): number {
    return this.targetSequence.findIndex(
      ([targetX, targetZ]) => targetX === x && targetZ === z,
    );
  }

  public getReward(result: TurnResult): number {
    if (result.playerAction === PlayerAction.JUMP) {
      // Jump does not change position
      return 0;
    }

    const newPosSeqIndex = this.sequenceIndex(
      result.newPlayerState.xPosition,
      result.newPlayerState.zPosition,
    );

    if (this.sequenceLength === 0) {
      if (newPosSeqIndex !== -1) {
        this.sequenceLength = 1;
        console.log("starting sequence");
        return 1;
      }
      return 0;
    }

    const oldPosSeqIndex = this.sequenceIndex(
      result.oldPlayerState.xPosition,
      result.oldPlayerState.zPosition,
    );

    if (oldPosSeqIndex === -1) {
      // Shouldn't happen
      this.sequenceLength = 0;
      return 0;
    }

    if (newPosSeqIndex === -1) {
      this.sequenceLength = 0;
      return 0;
    }

    if (
      newPosSeqIndex === oldPosSeqIndex + 1 ||
      (newPosSeqIndex === 0 &&
        oldPosSeqIndex === this.targetSequence.length - 1)
    ) {
      this.sequenceLength++;
      if (this.sequenceLength === this.targetSequence.length) {
        this.sequenceLength = 0;
        return 10;
      }
      console.log("Still on sequence");
      return this.sequenceLength;
    }

    if (
      newPosSeqIndex === oldPosSeqIndex - 1 ||
      (newPosSeqIndex === this.targetSequence.length - 1 &&
        oldPosSeqIndex === 0)
    ) {
      this.sequenceLength = 0;
      return -1;
    }

    this.sequenceLength = 0;
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
