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
      return Array.from(qValues.entries()).reduce((a, b) =>
        a[1] > b[1] ? a : b,
      )[0];
    }
  }

  public observeResult(result: TurnResult): void {
    const { playerAction, newPlayerState } = result;
    const reward = result.newPlayerState.points - result.oldPlayerState.points;
    console.log("Reward:", reward);
    this.updateQTable(
      newPlayerState.xPosition,
      newPlayerState.zPosition,
      playerAction,
      reward,
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
      ...Array.from(this.qTable.get(newState)?.values() || [0]),
    );
    const newQValue =
      oldQValue +
      this.alpha * (reward + this.gamma * maxFutureQValue - oldQValue);
    this.setQValue(state, action, newQValue);
  }
}
