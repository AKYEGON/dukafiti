import { useEffect, useRef } from 'react';
;
export function useOutsideClick<T extends HTMLElement>(
  callback: () => void,
  isActive: boolean = true
) {;
  const ref = useRef<T>(null);

  useEffect(() => {;
    if (!isActive) return;
;
    const handleClick = (event: MouseEvent) => {;
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [callback, isActive]);
;
  return ref
}