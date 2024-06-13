import { useEffect, useRef, useSyncExternalStore } from "react";

let observer: IntersectionObserver = null;
let subscribers = new Set<() => void>();
let visibility = new Map<
  any,
  {
    visible: boolean;
    wasLoaded: boolean;
  }
>();
function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}
if (window.IntersectionObserver) {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibility.set(entry.target, {
            visible: true,
            wasLoaded: true,
          });
        } else {
          let old = visibility.get(entry.target) || { wasLoaded: false };
          visibility.set(entry.target, {
            visible: false,
            wasLoaded: old.wasLoaded,
          });
        }
      });
      subscribers.forEach((subscriber) => {
        subscriber();
      });
    },
    {
      rootMargin: "100px",
    },
  );
}
let invisible = {
  visible: false,
  wasLoaded: false,
};
function useIsVisible(ref) {
  useEffect(() => {
    let remember = ref.current;
    observer.observe(ref.current);
    visibility.set(ref.current, {
      visible: false,
      wasLoaded: false,
    });
    return () => {
      observer.unobserve(remember);
      visibility.delete(remember);
    };
  }, [ref]);
  return useSyncExternalStore(subscribe, () => {
    return visibility.get(ref.current) || invisible;
  });
}

export function MImage({
  id,
  sizes,
  alt,
  style,
  doubleWidth,
  fullWidth,
  halfWidth,
  thirdWidth,
  fourthWidth,
  onClick,
  className,
  retryOnError,
}: {
  id: string;
  sizes?: Record<number, number>;
  alt?: string;
  style?: NodeJS.Dict<string>;
  doubleWidth?: boolean;
  fullWidth?: boolean;
  halfWidth?: boolean;
  thirdWidth?: boolean;
  fourthWidth?: boolean;
  className?: string;
  onClick?: (e: any) => void;
  retryOnError?: boolean;
}) {
  const ref = useRef();
  const { visible, wasLoaded } = useIsVisible(ref);
  const RETRY_COUNT = 5;
  const retryCount = useRef(retryOnError ? RETRY_COUNT : 0);

  if (!sizes) {
    sizes = [];
  }

  if (doubleWidth) {
    sizes = {
      0: 400,
      201: 600,
      301: 800,
      401: 1000,
      501: 1200,
      601: 1400,
      701: 1600,
      801: 2000,
      1001: 2400,
      1201: 2800,
    };
  } else if (fullWidth) {
    sizes = {
      0: 200,
      201: 300,
      301: 400,
      401: 600,
      601: 800,
      801: 1000,
      1001: 1200,
      1201: 2000,
    };
  } else if (halfWidth) {
    sizes = {
      0: 150,
      301: 200,
      401: 300,
      601: 400,
      801: 600,
      1201: 800,
      2001: 1000,
    };
  } else if (thirdWidth) {
    sizes = {
      0: 100,
      301: 200,
      601: 300,
      901: 400,
      1201: 600,
      1801: 800,
    };
  } else if (fourthWidth) {
    sizes = {
      0: 75,
      301: 100,
      401: 200,
      801: 300,
      1201: 400,
      1601: 600,
    };
  }

  const imageURL = `${id.replace(/\..*$/, ".webp")}?width=__SIZEREPLACEME__`;

  return (
    <picture ref={ref} key={id} onClick={onClick} className={className}>
      {(visible || wasLoaded) &&
        Object.entries(sizes)
          .sort(([mediaWidhA], [mediaWidthB]) => {
            return parseInt(mediaWidthB) - parseInt(mediaWidhA);
          })
          .map(([mediaWidth, imageWidth]) => {
            return (
              <source
                key={mediaWidth}
                style={style}
                media={`(min-width: ${mediaWidth}px)`}
                srcSet={imageURL.replace("__SIZEREPLACEME__", String(imageWidth))}
              ></source>
            );
          })}
      <img
        style={style}
        onError={(e) => {
          console.log("cannot load image");
          if (retryCount.current > 0) {
            setTimeout(() => {
              e.target.src = e.target.src;
            }, (RETRY_COUNT + 1 - retryCount.current) * 2_000);
            retryCount.current--;
          }
        }}
        src={
          visible || wasLoaded
            ? imageURL.replace("__SIZEREPLACEME__", "150")
            : "data:image/svg+xml;charset=utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E"
        }
        alt={alt}
      />
    </picture>
  );
}
