import { useCallback, useMemo, useRef } from 'react';

/**
 * A simple React hook for differentiating click and long press (click and hold) on the same component.
 *
 * @param {function} onClick A callback function for click events
 * @param {function} onLongpress A callback function for long press events
 * @param {number} ms The amount of time (in milliseconds) to wait before differentiating a single from a double click (defaults to 200ms)
 * 
 * @example Usage:
 *    const checkLongpress = useLongpress({
 *      onClick: ev => clickCallback(ev),
 *      onLongpress: ev => logpressCallback(ev),
 *      ms: 300
 *    });
 * 
 *    <element {...checkLongpress} />
*/
export function useLongpress({
  onClick = () => {},
  onLongpress = () => {},
  ms = 200
} = {}) {
  const timerRef = useRef(false);
  const eventRef = useRef({});

  const callbackLongpress = useCallback(() => {
    onLongpress(eventRef.current);
    eventRef.current = {};
    timerRef.current = false;
  }, [onLongpress]);

  const start = useCallback((ev) => {
    ev.persist();
    eventRef.current = ev;
    timerRef.current = setTimeout(callbackLongpress, ms);
  }, [callbackLongpress, ms]);

  const stop = useCallback((ev) => {
    ev.persist();
    eventRef.current = ev;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      onClick(eventRef.current);
      timerRef.current = false;
      eventRef.current = {};
    }
  }, [onClick]);

  return useMemo(() => ({
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  }), [start, stop]);
}