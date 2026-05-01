# Astro Simple Personal Homepage

```bash
# 使用 npx（无需安装）
npx asph init my-blog

# 或全局安装后使用
npm install -g asph
asph init my-blog

# 选项
asph init my-blog --template default --force  # 强制覆盖
```

```bash
cd my-blog
asph dev          # 默认端口 4321
asph dev -p 3000  # 指定端口
```

```bash
asph build        # 输出到 dist/
asph preview      # 预览生产版本
```

| 命令 | 描述 | 选项 |
|------|------|------|
| `asph init [name]` | 初始化新项目 | `-t, --template`, `-f, --force` |
| `asph dev` | 本地开发预览 | `-p, --port`, `-h, --host` |
| `asph build` | 构建生产版本 | - |
| `asph preview` | 预览生产构建 | `-p, --port` |
| `asph help` | 显示帮助信息 | - |