# @liuman/react-contextmenu

一个**不惹麻烦**的 React 右键菜单。

[在线演示](https://mxyg.github.io/react-contextmenu/) · [npm](https://www.npmjs.com/package/@liuman/react-contextmenu)

右键菜单看着简单，真做起来烦人的是这几件——这个包就是为它们写的：

| 会出的问题 | 这里怎么处理 |
| --- | --- |
| 在窗口右下角右键，菜单被切掉半截 | 量完自身尺寸再定位，**贴边自动翻转** |
| 菜单太长，把页面撑出一条滚动条 | 定位收敛在视口内，**从不产生滚动条** |
| 父容器 `overflow: hidden` 把菜单裁了 | 渲染进 **portal**，不受父级裁剪影响 |
| 二级菜单在右边缘继续往右开，看不见 | 子菜单同样会**朝另一边**开 |
| 触屏上根本没有"右键" | `bind()` 同时绑好**长按 500ms** |
| 要自己记"现在右键的是哪一项" | `bind(ctx)` 把上下文**原样带回**给你 |

## 安装

```bash
npm i @liuman/react-contextmenu styled-components
```

`react >= 18`、`react-dom >= 18`、`styled-components >= 6` 是 peer 依赖。

## 用法

```tsx
import { ContextMenu, useContextMenu, type ContextMenuItem } from '@liuman/react-contextmenu';

const items: ContextMenuItem[] = [
  { key: 'open', label: '打开' },
  { key: 'd1', divider: true },
  {
    key: 'send',
    label: '发送到',
    children: [
      { key: 'send-desktop', label: '桌面快捷方式' },
      { key: 'send-mail', label: '邮件收件人' },
    ],
  },
  { key: 'paste', label: '粘贴', disabled: true },
  { key: 'delete', label: '删除', danger: true },
];

function FileList({ files }: { files: File[] }) {
  const menu = useContextMenu<File>();

  return (
    <>
      {files.map((f) => (
        // ★ bind 把右键和长按都绑好，f 会原样带回到 menu.ctx
        <div key={f.id} {...menu.bind(f)}>{f.name}</div>
      ))}

      <ContextMenu
        open={menu.open}
        point={menu.point}
        items={items}
        onAction={(key) => handle(key, menu.ctx)}
        onClose={menu.close}
      />
    </>
  );
}
```

## API

### `useContextMenu<T>(options?)`

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `longPressMs` | `500` | 触屏长按多久算"右键" |
| `moveTolerance` | `4` | 长按期间手指移动超过这么多像素就取消（是在滚动，不是在长按） |
| `onOpen` | — | `(ctx, point) => void`，菜单打开时回调 |

返回：`{ open, point, ctx, bind, openAt, close }`。

- `bind(ctx)` —— 展开到目标元素上，绑好 `onContextMenu` 与触摸事件。
- `openAt(point, ctx)` —— 自己控制在哪打开（比如键盘菜单键）。

### `<ContextMenu />`

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `open` | `boolean` | 开关 |
| `point` | `{ x, y }` | **视口坐标**（`clientX/clientY`），不是页面坐标 |
| `items` | `ContextMenuItem[]` | 菜单项 |
| `onAction` | `(key: string) => void` | 点了哪一项 |
| `onClose` | `() => void` | 关闭（点外面、按 Esc、选中某项后） |

### `ContextMenuItem`

```ts
{
  key: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;      // 红字，删除这类
  disabled?: boolean;
  divider?: boolean;     // 分隔线：只要 key + divider
  children?: ContextMenuItem[];  // 二级菜单
}
```

## 本地跑 demo

```bash
npm install
npm run dev:demo
```

## License

MIT
