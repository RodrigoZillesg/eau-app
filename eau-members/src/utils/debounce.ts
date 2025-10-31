/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;
  let lastCallTime: number | null = null;

  const { leading = false, trailing = true } = options;

  const invokeFunc = () => {
    if (lastArgs && lastThis) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
    }
    return result;
  };

  const startTimer = (wait: number) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      if (trailing && lastArgs) {
        invokeFunc();
      }
    }, wait);
  };

  const debounced = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const isFirstCall = !lastCallTime;

    lastCallTime = now;
    lastArgs = args;
    lastThis = this;

    if (isFirstCall && leading) {
      invokeFunc();
    } else {
      startTimer(wait);
    }
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = lastThis = lastCallTime = null;
  };

  debounced.flush = () => {
    if (timeout) {
      invokeFunc();
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;
  let lastCallTime = 0;

  const { leading = true, trailing = true } = options;

  const invokeFunc = () => {
    if (lastArgs && lastThis) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
    }
    return result;
  };

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCallTime = now;
      if (leading) {
        invokeFunc();
      }
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        lastCallTime = Date.now();
        timeout = null;
        invokeFunc();
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastCallTime = 0;
    lastArgs = lastThis = null;
  };

  return throttled;
}