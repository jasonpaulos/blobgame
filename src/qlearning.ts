type Action = "forward" | "backward" | "left" | "right" | "jump";

class QLearning {
  private qTable: Map<string, Map<Action, number>>;
  private alpha: number;
  private gamma: number;
  public epsilon: number;
  private epsilonDecaryRate: number;
  private actions: Action[];

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
    this.qTable = new Map();
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.epsilonDecaryRate = epsilonDecaryRate;
    this.actions = ["forward", "backward", "left", "right", "jump"];
  }

  private getStateKey(x: number, z: number): string {
    return `${x},${z}`;
  }

  private getQValue(state: string, action: Action): number {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Map(this.actions.map((a) => [a, 0])));
    }
    return this.qTable.get(state)!.get(action)!;
  }

  private setQValue(state: string, action: Action, value: number): void {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Map(this.actions.map((a) => [a, 0])));
    }
    this.qTable.get(state)!.set(action, value);
  }

  private decayEpsilon(): number {
    this.epsilon *= this.epsilonDecaryRate;
    return this.epsilon;
  }

  public getActionSpread(x: number, z: number): Map<Action, number> {
    const state = this.getStateKey(x, z);
    return this.qTable.get(state) || new Map(this.actions.map((a) => [a, 0]));
  }

  public chooseAction(x: number, z: number): Action {
    const state = this.getStateKey(x, z);
    if (Math.random() < this.decayEpsilon()) {
      console.log("Exploring. Epsilon:", this.epsilon);
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    } else {
      console.log("Exploiting. Epsilon:", this.epsilon);
      const qValues = this.qTable.get(state);
      if (!qValues)
        return this.actions[Math.floor(Math.random() * this.actions.length)];
      return Array.from(qValues.entries()).reduce((a, b) =>
        a[1] > b[1] ? a : b,
      )[0];
    }
  }

  public updateQTable(
    x: number,
    z: number,
    action: Action,
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

export { QLearning, Action };
