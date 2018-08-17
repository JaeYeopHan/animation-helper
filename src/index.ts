import { getUserAgent } from "./Agent";

interface AnimationProp {
  refinedTarget: HTMLElement;
  className: string;
  option?: AnimationOption;
}

interface AnimationOption {
  removeClassOnEnd?: boolean;
  timeout?: number;
}

interface AnimatePromise {
  animationStatus: AnimationStatus;
}

export const enum AnimationStatus {
  READY = "READY",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  REJECT = "REJECT"
}

const defaultOption: AnimationOption = {
  removeClassOnEnd: true,
  timeout: 1000
};

const animate = (props: AnimationProp): Promise<AnimatePromise> => {
  const { refinedTarget: target, className, option } = props;
  const animationOption = { ...defaultOption, ...option };
  const { removeClassOnEnd, timeout } = animationOption;

  let animationStatus: AnimationStatus = AnimationStatus.READY;

  const clearAnimates = (onAnimationEnd: () => void) => {
    target.removeEventListener("animationend", onAnimationEnd);
    requestAnimationFrame(
      () => removeClassOnEnd && target.classList.remove(className)
    );
  };

  return new Promise<AnimatePromise>((resolve, reject) => {
    const onAnimationEnd = () => {
      clearAnimates(onAnimationEnd);
      animationStatus = AnimationStatus.DONE;
      return resolve({ animationStatus });
    };

    if (!isAnimationSupportDevice()) {
      animationStatus = AnimationStatus.DONE;
      return onAnimationEnd();
    }

    target.addEventListener("animationend", onAnimationEnd);
    target.classList.add(className);
    animationStatus = AnimationStatus.IN_PROGRESS;

    setTimeout(() => {
      if (animationStatus !== AnimationStatus.DONE) {
        clearAnimates(onAnimationEnd);
        animationStatus = AnimationStatus.REJECT;
        reject({ animationStatus });
      }
    }, timeout);
  });
};

const refineElement = (target: HTMLElement | HTMLElement[]): HTMLElement[] => {
  if (target instanceof HTMLElement) {
    return [target as HTMLElement];
  } else if (Array.isArray(target)) {
    return target as HTMLElement[];
  }
};

/**
 * Public API
 * @param target animation target
 * @param className trigger CSS class
 * @param option animation trigger option
 */
export const animates = (
  target: HTMLElement | HTMLElement[],
  className: string,
  option?: AnimationOption
): Promise<AnimatePromise[]> => {
  const promises = refineElement(target).map(refinedTarget =>
    animate({
      refinedTarget,
      className,
      option
    })
  );

  return Promise.all<AnimatePromise>(promises);
};

export function isAnimationSupportDevice(): boolean {
  const os = getUserAgent().os;

  return !(os.android && os.version < 5);
}
