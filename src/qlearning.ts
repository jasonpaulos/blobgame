import {
  PlayerAction,
  PlayerController,
  PlayerState,
  TurnResult,
} from "./game";

const actions = [
  PlayerAction.MOVE_X_POSITIVE,
  PlayerAction.MOVE_X_NEGATIVE,
  PlayerAction.MOVE_Z_POSITIVE,
  PlayerAction.MOVE_Z_NEGATIVE,
  PlayerAction.JUMP,
];

function weightedRandomChoice(weights: number[]): number {
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  if (totalWeight === 0) {
    return Math.floor(Math.random() * weights.length);
  }
  let r = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}

function maxChoice(values: number[]): number {
  let maxIndexes = [0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] > max) {
      max = values[i];
      maxIndexes = [i];
    } else if (values[i] === max) {
      maxIndexes.push(i);
    }
  }
  return maxIndexes[Math.floor(Math.random() * maxIndexes.length)];
}

export class QLearningPlayerController extends PlayerController {
  private qTable: Map<string, Map<PlayerAction, number>>;
  private alpha: number;
  private gamma: number;
  public epsilon: number;
  private epsilonDecaryRate: number;

  constructor({
    alpha,
    gamma,
    epsilon,
    epsilonDecaryRate,
  }: {
    alpha: number;
    gamma: number;
    epsilon: number;
    epsilonDecaryRate: number;
  }) {
    super();
    this.qTable = new Map();
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.epsilonDecaryRate = epsilonDecaryRate;
  }

  private getStateKey(x: number, z: number): string {
    return `${x},${z}`;
  }

  private getQValue(state: string, action: PlayerAction): number {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Map(actions.map((a) => [a, 0])));
    }
    return this.qTable.get(state)!.get(action)!;
  }

  private setQValue(state: string, action: PlayerAction, value: number): void {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Map(actions.map((a) => [a, 0])));
    }
    this.qTable.get(state)!.set(action, value);
  }

  private decayEpsilon(): number {
    this.epsilon *= this.epsilonDecaryRate;
    return this.epsilon;
  }

  public getActionSpread(x: number, z: number): Map<PlayerAction, number> {
    const state = this.getStateKey(x, z);
    return this.qTable.get(state) || new Map(actions.map((a) => [a, 0]));
  }

  public takeAction(state: PlayerState): PlayerAction {
    const stateKey = this.getStateKey(state.xPosition, state.zPosition);
    if (Math.random() < this.decayEpsilon()) {
      console.log("Exploring. Epsilon:", this.epsilon);
      return actions[Math.floor(Math.random() * actions.length)];
    } else {
      console.log("Exploiting. Epsilon:", this.epsilon);
      const qValues = this.qTable.get(stateKey);
      if (!qValues) return actions[Math.floor(Math.random() * actions.length)];
      const entries = Array.from(qValues.entries());
      return entries[maxChoice(entries.map((e) => e[1]))][0];
    }
  }

  public observeResult(result: TurnResult): void {
    const { playerAction, oldPlayerState, newPlayerState } = result;
    console.log("Reward:", result.playerReward);
    this.updateQTable(
      oldPlayerState.xPosition,
      oldPlayerState.zPosition,
      playerAction,
      result.playerReward,
      newPlayerState.xPosition,
      newPlayerState.zPosition,
    );
  }

  public updateQTable(
    x: number,
    z: number,
    action: PlayerAction,
    reward: number,
    newX: number,
    newZ: number,
  ): void {
    const state = this.getStateKey(x, z);
    const newState = this.getStateKey(newX, newZ);
    const oldQValue = this.getQValue(state, action);
    const maxFutureQValue = Math.max(
      ...actions.map((a) => this.getQValue(newState, a)),
    );
    const newQValue =
      (1 - this.alpha) * oldQValue +
      this.alpha * (reward + this.gamma * maxFutureQValue);
    // console.log(
    //   `Q(${state}, ${action}) from ${oldQValue.toFixed(3)} to ${newQValue.toFixed(3)}`,
    // );
    this.setQValue(state, action, newQValue);
  }
}
