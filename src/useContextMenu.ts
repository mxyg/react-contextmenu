/**
 * @文件 useContextMenu.ts
 * @职责 右键/长按触发菜单的状态与事件绑定
 * @路径 components/packages/react-contextmenu/src/useContextMenu.ts
 *
 * 触屏没有右键，所以**长按等价于右键**——同一个菜单，同一套上下文。
 * 长按期间只要手指移动超过阈值就取消（那是在拖，不是在唤菜单）。
 */
import { useCallback, useRef, useState } from 'react';
import type { ContextMenuPoint } from './types';

export interface UseContextMenuOptions<T> {
  /** 长按多久算长按（毫秒），默认 500 */
  longPressMs?: number;
  /** 按下后移动多少像素就取消长按，默认 4 */
  moveTolerance?: number;
  /** 菜单打开时回调（可用来同步选中态） */
  onOpen?: (ctx: T, point: ContextMenuPoint) => void;
}

export interface ContextMenuState<T> {
  open: boolean;
  point: ContextMenuPoint;
  ctx: T | null;
}

export function useContextMenu<T = unknown>(options: UseContextMenuOptions<T> = {}) {
  const { longPressMs = 500, moveTolerance = 4, onOpen } = options;
  const [state, setState] = useState<ContextMenuState<T>>({ open: false, point: { x: 0, y: 0 }, ctx: null });
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<ContextMenuPoint | null>(null);

  const openAt = useCallback(
    (point: ContextMenuPoint, ctx: T) => {
      setState({ open: true, point, ctx });
      onOpen?.(ctx, point);
    },
    [onOpen],
  );

  const close = useCallback(() => setState((s) => (s.open ? { ...s, open: false } : s)), []);

  const cancelLongPress = useCallback(() => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
  }, []);

  /** 绑到目标元素上：右键直接开，长按 500ms 也开 */
  const bind = useCallback(
    (ctx: T) => ({
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        cancelLongPress();
        openAt({ x: e.clientX, y: e.clientY }, ctx);
      },
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button === 2) return; // 右键交给 contextmenu
        startRef.current = { x: e.clientX, y: e.clientY };
        const point = { x: e.clientX, y: e.clientY };
        timerRef.current = window.setTimeout(() => openAt(point, ctx), longPressMs);
      },
      onPointerMove: (e: React.PointerEvent) => {
        const start = startRef.current;
        if (!start) return;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > moveTolerance) cancelLongPress();
      },
      onPointerUp: cancelLongPress,
      onPointerCancel: cancelLongPress,
    }),
    [cancelLongPress, longPressMs, moveTolerance, openAt],
  );

  return { ...state, openAt, close, bind, cancelLongPress };
}
