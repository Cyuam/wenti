# 文体部工作台

一个纯静态单页网站，用于文体部工作流程加速与规范。可直接部署到 GitHub Pages。

## 功能

- **参考文件**：往届策划案、节目单、推文、简报等供新成员参考下载
- **策划案生成**：填写表单 → 一键生成规范策划案 → 预览 / 下载 HTML / 打印另存 PDF
- **奖品库**：按低/中/高价位分类的常用奖品，勾选 + 填数量自动带入策划案；支持自定义奖品

## 部署到 GitHub Pages

1. 把整个目录推送到 GitHub 仓库（建议仓库名 `sports-dept-workbench` 或类似）
2. 仓库 **Settings → Pages → Source** 选 `main` 分支 `/ (root)` 目录
3. 保存后几分钟即可访问 `https://你的用户名.github.io/仓库名/`

> 已包含 `.nojekyll` 文件，确保 GitHub Pages 不会因 Jekyll 处理而漏掉下划线开头的文件。

## 后续上传文件

1. 把文件放到仓库的 `downloads/` 目录
2. 编辑 `files.js`，在 `window.DOWNLOAD_FILES` 数组里加一行：
   ```js
   { name: '显示名', file: 'downloads/文件名', desc: '说明', tag: '分类' }
   ```
3. 推送即可

## 修改奖品库

编辑 `prizes.js`，按 `low` / `mid` / `high` 三个价位数组增删奖品项：
```js
{ name: '奖品名', price: 单价 }
```

## 文件结构

```
index.html      主页面
style.css       样式
app.js          主逻辑（表单、奖品勾选、策划案生成）
files.js        文件下载清单（可编辑）
prizes.js       奖品库（可编辑）
.nojekyll       GitHub Pages 配置
downloads/      放下载文件（自行创建）
```
