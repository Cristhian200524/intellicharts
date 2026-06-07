/**
 * Handles rendering animation frame schedules.
 */
export class Animator {
  private frameId: number | null = null;

  /**
   * Starts animation frames.
   * Cancels active animation frames if already running.
   */
  public start(
    duration: number,
    onTick: (progress: number) => void,
    onComplete?: () => void
  ): void {
    this.cancel();

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);

      onTick(eased);

      if (progress < 1) {
        this.frameId = requestAnimationFrame(tick);
      } else {
        this.frameId = null;
        if (onComplete) {
          onComplete();
        }
      }
    };

    this.frameId = requestAnimationFrame(tick);
  }

  /**
   * Cancels active animation frames.
   */
  public cancel(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Cubic easing curve.
   */
  private easeOutCubic(t: number): number {
    return --t * t * t + 1;
  }
}

/**
 * Manages category values transitions from previous rendering states.
 */
export class TransitionManager {
  private lastRatios: Map<string, number> = new Map();

  /**
   * Evaluates if this is the first render.
   */
  public isFirstRender(): boolean {
    return this.lastRatios.size === 0;
  }

  /**
   * Generates interpolated ratio arrays between previous and target states.
   */
  public getInterpolatedRatios(
    categories: string[],
    newValues: number[],
    targetYMax: number,
    progress: number
  ): number[] {
    return categories.map((cat, index) => {
      const newVal = newValues[index] ?? 0;
      const newRatio = targetYMax > 0 ? newVal / targetYMax : 0;
      const lastRatio = this.lastRatios.get(cat) ?? 0;
      return lastRatio + (newRatio - lastRatio) * progress;
    });
  }

  /**
   * Caches current categories and ratios as the baseline for the next transition.
   */
  public saveRatios(categories: string[], values: number[], yMax: number): void {
    this.lastRatios.clear();
    categories.forEach((cat, index) => {
      const val = values[index] ?? 0;
      const ratio = yMax > 0 ? val / yMax : 0;
      this.lastRatios.set(cat, ratio);
    });
  }
}
