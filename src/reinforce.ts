import { DQNSolver, DQNOpt, DQNEnv } from "reinforce-js";
import { Mat } from "recurrent-js";
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

export class ReinforceJSPlayerController extends PlayerController {
  private solver: DQNSolver;

  constructor() {
    super();

    const width = 400;
    const height = 400;
    const numberOfStates = 3;
    const numberOfActions = 5;
    const env = new DQNEnv(width, height, numberOfStates, numberOfActions);

    const opt = new DQNOpt();
    opt.setTrainingMode(true);
    opt.setNumberOfHiddenUnits([/*100*/ 4]); // mind the array here, currently only one layer supported! Preparation for DNN in progress...
    opt.setEpsilonDecay(1.0, 0.3, 500 /*1e6*/);
    opt.setEpsilon(0.05);
    opt.setGamma(0.9);
    opt.setAlpha(0.1); // 0.005
    opt.setLossClipping(true);
    opt.setLossClamp(1.0);
    opt.setRewardClipping(true);
    opt.setRewardClamp(1.0);
    opt.setExperienceSize(1000 /*1e6*/);
    opt.setReplayInterval(5);
    opt.setReplaySteps(5);

    /*
    Outfit solver with environment complexity and specs.
    After configuration it's ready to train its untrained Q-Network and learn from SARSA experiences.
    */
    this.solver = new DQNSolver(env, opt);
  }

  getEpsilon(): number {
    return this.solver["currentEpsilon"]();
  }

  public getActionSpread(x: number, z: number): Map<PlayerAction, number> {
    const stateVector = new Mat(3, 1);
    stateVector.setFrom([x - 2.5, z - 2.5, (x - 2.5) * (z - 2.5)]);
    const actionVector = this.solver["forwardQ"](stateVector);
    const spread = new Map<PlayerAction, number>();
    for (let i = 0; i < actions.length; i++) {
      spread.set(actions[i], actionVector.w[i]);
    }
    return spread;
  }

  takeAction(playerState: PlayerState): PlayerAction {
    /*
Determine a state, e.g.:
*/
    const state = [
      /* Array with numerical values and length of 20 as configured via numberOfStates */
      playerState.xPosition - 2.5,
      playerState.zPosition - 2.5,
      (playerState.xPosition - 2.5) * (playerState.zPosition - 2.5),
    ];

    /*
  Now inject state and receive the preferred action as index from 0 to 3 as configured via numberOfActions.
  */
    const action = this.solver.decide(state);
    return actions[action];
  }
  observeResult(result: TurnResult, reward: number): void {
    /*
Now calculate some Reward and let the Solver learn from it, e.g.:
*/
    console.log("Reward:", reward);

    this.solver.learn(reward);
  }
}
