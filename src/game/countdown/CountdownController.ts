export type CountdownState =
  | 'IDLE'
  | 'RED'
  | 'COUNT_3'
  | 'COUNT_2'
  | 'COUNT_1'
  | 'ANTICIPATION'
  | 'GREEN_GO'
  | 'FINISHED';

export interface CountdownControllerCallbacks {
  onStateChange?: (state: CountdownState, number: number | null) => void;
  onRedLight?: () => void;
  onYellowLight?: () => void;
  onAnticipation?: () => void;
  onGreenLaunch?: () => void;
  onCountdownTick?: (count: number) => void;
}

export class CountdownController {
  private currentState: CountdownState = 'IDLE';
  private timer: number = 0;
  private isRunning: boolean = false;
  private callbacks: CountdownControllerCallbacks = {};

  // Timing configuration (seconds)
  public static readonly RED_PHASE_DURATION = 0.8;
  public static readonly COUNT_3_DURATION = 1.0;
  public static readonly COUNT_2_DURATION = 1.0;
  public static readonly COUNT_1_DURATION = 0.85;
  public static readonly ANTICIPATION_DURATION = 0.25;
  public static readonly GO_DURATION = 1.2;

  constructor(callbacks?: CountdownControllerCallbacks) {
    if (callbacks) this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: CountdownControllerCallbacks) {
    this.callbacks = callbacks;
  }

  public start() {
    this.isRunning = true;
    this.timer = 0;
    this.transitionTo('RED');
  }

  private transitionTo(newState: CountdownState) {
    this.currentState = newState;
    this.timer = 0;

    let displayNumber: number | null = null;
    switch (newState) {
      case 'RED':
        displayNumber = 3;
        this.callbacks.onRedLight?.();
        this.callbacks.onCountdownTick?.(3);
        break;

      case 'COUNT_3':
        displayNumber = 3;
        this.callbacks.onCountdownTick?.(3);
        break;

      case 'COUNT_2':
        displayNumber = 2;
        this.callbacks.onYellowLight?.();
        this.callbacks.onCountdownTick?.(2);
        break;

      case 'COUNT_1':
        displayNumber = 1;
        this.callbacks.onCountdownTick?.(1);
        break;

      case 'ANTICIPATION':
        displayNumber = 1;
        this.callbacks.onAnticipation?.();
        break;

      case 'GREEN_GO':
        displayNumber = 0; // 0 represents GO!
        this.callbacks.onGreenLaunch?.();
        this.callbacks.onCountdownTick?.(0);
        break;

      case 'FINISHED':
        displayNumber = null;
        this.isRunning = false;
        break;
    }

    this.callbacks.onStateChange?.(newState, displayNumber);
  }

  /**
   * Delta-time safe update method (monotonic)
   */
  public update(dt: number): {
    state: CountdownState;
    displayNumber: number | null;
    isControlsLocked: boolean;
    isRaceStarted: boolean;
    elapsedInState: number;
  } {
    if (!this.isRunning || this.currentState === 'FINISHED') {
      return {
        state: this.currentState,
        displayNumber: null,
        isControlsLocked: false,
        isRaceStarted: this.currentState === 'FINISHED' || this.currentState === 'GREEN_GO',
        elapsedInState: this.timer,
      };
    }

    this.timer += dt;

    switch (this.currentState) {
      case 'RED':
        if (this.timer >= CountdownController.RED_PHASE_DURATION) {
          this.transitionTo('COUNT_3');
        }
        break;

      case 'COUNT_3':
        if (this.timer >= CountdownController.COUNT_3_DURATION) {
          this.transitionTo('COUNT_2');
        }
        break;

      case 'COUNT_2':
        if (this.timer >= CountdownController.COUNT_2_DURATION) {
          this.transitionTo('COUNT_1');
        }
        break;

      case 'COUNT_1':
        if (this.timer >= CountdownController.COUNT_1_DURATION) {
          this.transitionTo('ANTICIPATION');
        }
        break;

      case 'ANTICIPATION':
        if (this.timer >= CountdownController.ANTICIPATION_DURATION) {
          this.transitionTo('GREEN_GO');
        }
        break;

      case 'GREEN_GO':
        if (this.timer >= CountdownController.GO_DURATION) {
          this.transitionTo('FINISHED');
        }
        break;
    }

    let num: number | null = null;
    if (this.currentState === 'RED' || this.currentState === 'COUNT_3') num = 3;
    else if (this.currentState === 'COUNT_2') num = 2;
    else if (this.currentState === 'COUNT_1' || this.currentState === 'ANTICIPATION') num = 1;
    else if (this.currentState === 'GREEN_GO') num = 0;

    const isControlsLocked =
      (this.currentState as CountdownState) !== 'GREEN_GO' &&
      (this.currentState as CountdownState) !== 'FINISHED';

    const isRaceStarted =
      (this.currentState as CountdownState) === 'GREEN_GO' ||
      (this.currentState as CountdownState) === 'FINISHED';

    return {
      state: this.currentState,
      displayNumber: num,
      isControlsLocked,
      isRaceStarted,
      elapsedInState: this.timer,
    };
  }

  public syncFromNetwork(count: number) {
    if (count === 3) this.transitionTo('COUNT_3');
    else if (count === 2) this.transitionTo('COUNT_2');
    else if (count === 1) this.transitionTo('COUNT_1');
    else if (count === 0) this.transitionTo('GREEN_GO');
  }

  public reset() {
    this.currentState = 'IDLE';
    this.timer = 0;
    this.isRunning = false;
  }

  public getState(): CountdownState {
    return this.currentState;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}
