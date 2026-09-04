/**
 * @文件 types.ts
 * @职责 @liuman/react-contextmenu 公共类型
 * @路径 components/packages/react-contextmenu/src/types.ts
 */
import type React from 'react';

export interface ContextMenuItem {
  key: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  /** 危险操作（删除之类）：红字 */
  danger?: boolean;
  disabled?: boolean;
  /** 分隔线：只需要 key + divider */
  divider?: boolean;
  /** 二级菜单 */
  children?: ContextMenuItem[];
}

export interface ContextMenuPoint {
  /** 视口坐标（clientX/clientY），不是页面坐标 */
  x: number;
  y: number;
}
