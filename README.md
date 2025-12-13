# @wyx-ui/react

一个功能丰富、设计精美的 React UI 组件库，包含多种动画交互组件。

## ✨ 特性

- 🚀 **开箱即用**：提供丰富的通用组件
- 🎨 **动画交互**：内置多种精美的动画按钮和特效
- 📝 **TypeScript**：完全使用 TypeScript 编写，提供完整的类型支持
- 💅 **样式定制**：基于 SCSS，易于定制

## 📦 安装

```bash
npm install @wyx-ui/react
# 或者
yarn add @wyx-ui/react
```

## 🔨 使用

```tsx
import { Button } from "@wyx-ui/react";
import "@wyx-ui/react/dist/index.css"; // 引入样式（如果有）

export default function Demo() {
  return <Button variant="primary">确定</Button>;
}
```

## 🧩 组件列表

### 基础组件 (General)
- **Button**: 基础按钮
- **Icons**: 图标集合 (Loading, Close, Color, Delete, etc.)
- **Image**: 图片组件，支持滤镜和预览
- **Modal**: 模态框
- **Popover**: 气泡卡片
- **Message**: 全局消息提示

### 动画按钮 (Animated Buttons)
包含多种交互动画的按钮组件：
- **LanguageBtn**: 语言切换按钮
- **ThemeBtn**: 主题切换按钮
- **LikeBtn**: 点赞按钮
- **LoadingBtn**: 加载状态按钮
- **MenuBtn**: 菜单按钮
- **ArrowBtn**, **CodeBtn**, **FullScreenBtn**, **IconBtn**, **ThumbBtn**, **VoiceBtn**

### 数据展示 & 特效 (Display & Effects)
- **BorderText**: 边框文本
- **SplitText**: 分割文本
- **PointText**: 点阵文本
- **TransformText**: 变形文本
- **TypeText**: 打字机效果文本
- **Marquee**: 跑马灯
- **Danmu**: 弹幕组件
- **FlipCard**: 翻转卡片
- **Swiper**: 轮播图
- **TimeLine**: 时间轴
- **Progress**: 进度条
- **Count**: 计数器

### 输入 & 工具 (Input & Utils)
- **AutoInput**: 自动输入框
- **Color**: 颜色选择/展示
- **CopyBtn**: 复制按钮
- **Note**: 笔记/便签
- **NoteBox**: 笔记盒子

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 License

MIT
