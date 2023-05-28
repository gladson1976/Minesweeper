import { useCallback, useMemo, useRef } from 'react';

  /**
   * A simple React hook for differentiating single and double clicks on the same component.
   *
   * @param {function} onSingleClick A callback function for single click events
   * @param {function} onDoubleClick A callback function for double click events
   * @param {number} [ms=200] The amount of time (in milliseconds) to wait before differentiating a single from a double click
   */
export function useDoubleclick ({
  onSingleClick = () => null,
  onDoubleClick = () => null,
  ms = 200
} = {}) {
  let clickCount = useRef(0);

  const handleClick = useCallback((e) => {
    clickCount.current += 1;
    setTimeout(() => {
      if (clickCount.current === 1) onSingleClick(e);
      else if (clickCount.current === 2) onDoubleClick(e);
      clickCount.current = 0;
    }, ms);
  }, [ms, onDoubleClick, onSingleClick]);

  return useMemo(() => ({
    onMouseDown: handleClick
  }), [handleClick]);
};
