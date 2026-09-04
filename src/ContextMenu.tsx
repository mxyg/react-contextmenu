/**
 * @文件 ContextMenu.tsx
 * @职责 右键菜单本体：视口边缘自动翻转、不撑出滚动条、二级菜单同样翻转
 * @路径 components/packages/react-contextmenu/src/ContextMenu.tsx
 *
 * 为什么不用现成 UI 库的 Dropdown：那类组件的定位是围着"锚点元素"转的，
 * 而右键菜单的锚点是**鼠标位置**。硬塞的话有两个老毛病：
 *   1. 贴着屏幕右/下边缘唤出时菜单被切掉（它只会往固定方向展开）
 *   2. 菜单挂在滚动容器里，超出部分把容器的滚动条挤出来——桌面上尤其难看
 * 这里的做法：**portal 到 body + position: fixed + 挂载后量真实尺寸再翻转/夹紧**。
 * fixed 不参与任何容器的滚动尺寸计算，所以永远不会挤出滚动条。
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import type { ContextMenuItem, ContextMenuPoint } from './types';

const Panel = styled.div<{ $left: number; $top: number }>`
  position: fixed;
  left: ${(p) => p.$left}px;
  top: ${(p) => p.$top}px;
  z-index: 10000;
  min-width: 168px;
  max-width: 280px;
  padding: 4px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.14);
  font-size: 13px;
  user-select: none;
`;

const Row = styled.div<{ $danger?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  white-space: nowrap;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  color: ${(p) =>
    p.$disabled ? 'rgba(0,0,0,0.25)' : p.$danger ? '#ff4d4f' : 'rgba(0,0,0,0.85)'};

  &:hover {
    background: ${(p) => (p.$disabled ? 'transparent' : 'rgba(0,0,0,0.05)')};
  }

  .label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .arrow {
    color: rgba(0, 0, 0, 0.35);
    font-size: 11px;
  }
`;

const Divider = styled.div`
  height: 1px;
  margin: 4px 6px;
  background: rgba(0, 0, 0, 0.06);
`;

/** 把菜单夹进视口：放不下就翻到反方向，再夹一次防止两边都放不下时溢出 */
const fitIntoViewport = (
  point: ContextMenuPoint,
  size: { width: number; height: number },
): { left: number; top: number } => {
  const gap = 6;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = point.x + size.width + gap > vw ? point.x - size.width : point.x;
  let top = point.y + size.height + gap > vh ? point.y - size.height : point.y;
  left = Math.max(gap, Math.min(left, Math.max(gap, vw - size.width - gap)));
  top = Math.max(gap, Math.min(top, Math.max(gap, vh - size.height - gap)));
  return { left, top };
};

interface SubmenuState {
  parentKey: string;
  items: ContextMenuItem[];
  point: ContextMenuPoint;
}

export interface ContextMenuProps {
  open: boolean;
  point: ContextMenuPoint;
  items: ContextMenuItem[];
  onAction: (key: string) => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ open, point, items, onAction, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: point.x, top: point.y });
  const [sub, setSub] = useState<SubmenuState | null>(null);
  const [subPos, setSubPos] = useState({ left: 0, top: 0 });

  // 每次打开都从鼠标点重新算
  useLayoutEffect(() => {
    if (!open) {
      setSub(null);
      return;
    }
    setPos({ left: point.x, top: point.y });
    const node = panelRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setPos(fitIntoViewport(point, { width: rect.width, height: rect.height }));
  }, [open, point.x, point.y, items]);

  useLayoutEffect(() => {
    if (!sub) return;
    const node = subRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setSubPos(fitIntoViewport(sub.point, { width: rect.width, height: rect.height }));
  }, [sub]);

  // 点外面、按 Esc、滚动、失焦都关掉——菜单赖着不走比没有菜单更烦
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || subRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onClose);
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', onClose, true);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onClose);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [open, onClose]);

  const handlePick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled || item.divider) return;
      if (item.children?.length) return; // 有子菜单的行本身不触发动作
      onAction(item.key);
      onClose();
    },
    [onAction, onClose],
  );

  if (!open || typeof document === 'undefined') return null;

  const renderRows = (list: ContextMenuItem[], isSub: boolean) =>
    list.map((item) =>
      item.divider ? (
        <Divider key={item.key} />
      ) : (
        <Row
          key={item.key}
          $danger={item.danger}
          $disabled={item.disabled}
          onPointerEnter={(e) => {
            if (isSub) return;
            if (item.children?.length && !item.disabled) {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              // 二级菜单从这一行的右侧展开；放不下时 fitIntoViewport 会把它翻到左边
              setSub({ parentKey: item.key, items: item.children, point: { x: rect.right, y: rect.top } });
            } else {
              setSub(null);
            }
          }}
          onClick={() => handlePick(item)}
        >
          {item.icon}
          <span className="label">{item.label}</span>
          {item.children?.length ? <span className="arrow">›</span> : null}
        </Row>
      ),
    );

  return createPortal(
    <>
      <Panel ref={panelRef} $left={pos.left} $top={pos.top} onContextMenu={(e) => e.preventDefault()}>
        {renderRows(items, false)}
      </Panel>
      {sub && (
        <Panel
          ref={subRef}
          $left={subPos.left}
          $top={subPos.top}
          onContextMenu={(e) => e.preventDefault()}
        >
          {sub.items.map((item) =>
            item.divider ? (
              <Divider key={item.key} />
            ) : (
              <Row
                key={item.key}
                $danger={item.danger}
                $disabled={item.disabled}
                onClick={() => handlePick(item)}
              >
                {item.icon}
                <span className="label">{item.label}</span>
              </Row>
            ),
          )}
        </Panel>
      )}
    </>,
    document.body,
  );
};

export default ContextMenu;
