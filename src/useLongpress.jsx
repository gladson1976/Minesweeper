import { useCallback, useMemo, useRef } from 'react';

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