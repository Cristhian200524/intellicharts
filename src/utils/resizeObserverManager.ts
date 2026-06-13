class ResizeObserverManager {
  private static instance: ResizeObserverManager | null = null;
  private observer: ResizeObserver | null = null;
  private callbacks = new Map<Element, (entry: ResizeObserverEntry) => void>();
  private lastSizes = new Map<Element, { width: number; height: number }>();
  private scheduledFrames = new Map<Element, number>();
  private latestEntries = new Map<Element, ResizeObserverEntry>();

  private constructor() {
    if (typeof window !== 'undefined' && window.ResizeObserver) {
      this.observer = new window.ResizeObserver((entries) => {
        for (const entry of entries) {
          const target = entry.target;
          const { width, height } = entry.contentRect;

          // Skip subpixel resizing changes (noise)
          const lastSize = this.lastSizes.get(target);
          if (lastSize && Math.abs(lastSize.width - width) < 0.5 && Math.abs(lastSize.height - height) < 0.5) {
            continue;
          }

          this.lastSizes.set(target, { width, height });
          this.latestEntries.set(target, entry);

          // Throttle redraws to at most once per animation frame
          if (!this.scheduledFrames.has(target)) {
            const frameId = window.requestAnimationFrame(() => {
              this.scheduledFrames.delete(target);
              const latestEntry = this.latestEntries.get(target);
              this.latestEntries.delete(target);

              if (latestEntry) {
                const callback = this.callbacks.get(target);
                if (callback) {
                  callback(latestEntry);
                }
              }
            });
            this.scheduledFrames.set(target, frameId);
          }
        }
      });
    }
  }

  public static getInstance(): ResizeObserverManager {
    if (!ResizeObserverManager.instance) {
      ResizeObserverManager.instance = new ResizeObserverManager();
    }
    return ResizeObserverManager.instance;
  }

  public observe(element: Element, callback: (entry: ResizeObserverEntry) => void): void {
    if (!this.observer) return;
    this.callbacks.set(element, callback);

    // Seed initial size to skip the redundant automatic callback right after mount
    const rect = element.getBoundingClientRect();
    this.lastSizes.set(element, { width: rect.width, height: rect.height });

    this.observer.observe(element);
  }

  public unobserve(element: Element): void {
    if (!this.observer) return;
    this.callbacks.delete(element);
    this.lastSizes.delete(element);
    this.latestEntries.delete(element);

    const frameId = this.scheduledFrames.get(element);
    if (frameId !== undefined) {
      window.cancelAnimationFrame(frameId);
      this.scheduledFrames.delete(element);
    }

    this.observer.unobserve(element);
  }
}

export const resizeObserverManager = ResizeObserverManager.getInstance();
