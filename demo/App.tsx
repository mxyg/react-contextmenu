/**
 * @liuman/react-contextmenu 的演示站。
 *
 * ★★ 这个 demo 要证明的不是"能弹出一个菜单"（谁都能做），
 *   而是那几件**做不好就会出事**的：
 *     ① 在窗口右下角右键，菜单会翻到左上，不会被切掉
 *     ② 菜单再长也不会把页面撑出滚动条
 *     ③ 二级菜单贴边时朝另一边开
 *     ④ 触屏上长按 500ms 也能开
 *   所以下面刻意给了"贴边区域"和"很长的菜单"，让人自己去试。
 */
import { useState } from 'react';
import { ContextMenu, useContextMenu, type ContextMenuItem } from '@liuman/react-contextmenu';

type Target = { name: string };

const ITEMS: ContextMenuItem[] = [
  { key: 'open', label: '打开' },
  { key: 'open-new', label: '在新窗口打开' },
  { key: 'd1', divider: true },
  {
    key: 'send',
    label: '发送到',
    children: [
      { key: 'send-desktop', label: '桌面快捷方式' },
      { key: 'send-mail', label: '邮件收件人' },
      { key: 'send-zip', label: '压缩文件夹' },
      {
        key: 'send-more',
        label: '更多位置',
        children: [
          { key: 'send-u', label: 'U 盘' },
          { key: 'send-cloud', label: '云盘' },
        ],
      },
    ],
  },
  { key: 'rename', label: '重命名' },
  { key: 'copy', label: '复制' },
  { key: 'paste', label: '粘贴', disabled: true },
  { key: 'd2', divider: true },
  { key: 'delete', label: '删除', danger: true },
];

/** ★ 故意很长：用来验证"菜单比视口还高时不会把页面撑出滚动条" */
const LONG_ITEMS: ContextMenuItem[] = Array.from({ length: 28 }, (_, i) => ({
  key: `row-${i}`,
  label: `第 ${i + 1} 项`,
  danger: i === 27,
}));

export default function App() {
  const menu = useContextMenu<Target>();
  const [last, setLast] = useState('');
  const [useLong, setUseLong] = useState(false);

  const cell = (name: string) => (
    <div className="cell" {...menu.bind({ name })}>
      {name}
    </div>
  );

  return (
    <div className="page">
      <header>
        <h1>@liuman/react-contextmenu</h1>
        <p className="lead">
          一个不惹麻烦的右键菜单：贴边自动翻转、永远不撑出滚动条、支持二级菜单、长按也能开。
        </p>
        <p className="links">
          <a href="https://www.npmjs.com/package/@liuman/react-contextmenu">npm</a>
          <a href="https://github.com/mxyg/react-contextmenu">GitHub</a>
        </p>
        <pre className="install">npm i @liuman/react-contextmenu styled-components</pre>
      </header>

      <section>
        <h2>试一下</h2>
        <p>
          在下面任意一格上<strong>右键</strong>（触屏<strong>长按 500ms</strong>）。
          重点试<strong>四个角</strong>——菜单会自己翻到有地方的那一边，而不是被窗口切掉半截。
        </p>
        <label className="toggle">
          <input type="checkbox" checked={useLong} onChange={(e) => setUseLong(e.target.checked)} />
          换成 28 项的超长菜单（验证不撑出滚动条）
        </label>

        <div className="grid">
          {cell('左上角')}
          {cell('上边')}
          {cell('右上角')}
          {cell('左边')}
          {cell('中间')}
          {cell('右边')}
          {cell('左下角')}
          {cell('下边')}
          {cell('右下角')}
        </div>

        <p className="result">
          {last ? <>刚才点了：<code>{last}</code></> : <span className="muted">还没点过菜单项</span>}
        </p>
      </section>

      <section>
        <h2>用法</h2>
        <pre className="code">{`const menu = useContextMenu<Target>();

<div {...menu.bind({ name: '文件 A' })}>文件 A</div>

<ContextMenu
  open={menu.open}
  point={menu.point}
  items={items}
  onAction={(key) => console.log(key, menu.ctx)}
  onClose={menu.close}
/>`}</pre>
        <ul className="notes">
          <li><code>bind(ctx)</code> 把右键和长按都绑好，<code>ctx</code> 会原样带回给你 —— 不用自己存"现在右键的是哪一个"。</li>
          <li>菜单渲染在 <strong>portal</strong> 里，所以父级的 <code>overflow: hidden</code> 不会把它裁掉。</li>
          <li>坐标用的是 <code>clientX/clientY</code>（视口坐标），页面滚动时不会错位。</li>
        </ul>
      </section>

      <ContextMenu
        open={menu.open}
        point={menu.point}
        items={useLong ? LONG_ITEMS : ITEMS}
        onAction={(key) => setLast(`${key}${menu.ctx ? ` @ ${menu.ctx.name}` : ''}`)}
        onClose={menu.close}
      />
    </div>
  );
}
