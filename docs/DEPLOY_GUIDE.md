# GitHub Pages 部署教程

## 一、前置条件

- 有 GitHub 账号
- 已安装 Git

---

## 二、创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 `+` → `New repository`
3. 填写信息：
   - **Repository name**: `dsl`（推荐这个名字，不需要额外配置）
   - **Description**: Dockerfile 在线校验器
   - **Public**（必须选 Public，GitHub Pages 免费版只支持公开仓库）
4. 点击 `Create repository`

---

## 三、上传代码到 GitHub

打开终端，在项目目录 `D:\for_job\dsl` 下执行：

```bash
# 1. 初始化 git（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Initial commit: Dockerfile Validator"

# 4. 添加远程仓库（把 YOUR_USERNAME 换成你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/dsl.git

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 四、启用 GitHub Pages

1. 进入你的仓库页面：`https://github.com/YOUR_USERNAME/dsl`
2. 点击 **Settings**（设置）
3. 左侧菜单找到 **Pages**
4. 在 **Build and deployment** 部分：
   - **Source**: 选择 `GitHub Actions`
5. 保存后，GitHub Actions 会自动运行部署

---

## 五、访问你的网站

部署完成后（通常需要 1-2 分钟），访问：

```
https://YOUR_USERNAME.github.io/dsl/
```

---

## 六、如果仓库名不是 `dsl`

如果你用了其他仓库名（比如 `dockerfile-validator`），需要修改配置：

### 方法1：修改 vite.config.ts

```typescript
const repoName = 'dockerfile-validator'  // 改成你的仓库名
```

然后重新构建并提交：

```bash
GITHUB_PAGES=true npm run build
git add .
git commit -m "Update repo name"
git push
```

### 方法2：使用自定义域名（可选）

1. 在仓库 Settings → Pages → Custom domain 填写你的域名
2. 修改 vite.config.ts 中的 `base: '/'`

---

## 七、常见问题

### Q: 页面显示空白？

检查浏览器控制台（F12），如果是资源 404 错误，说明 `base` 路径配置不对。

### Q: 如何更新网站？

```bash
git add .
git commit -m "Update"
git push
```

推送后 GitHub Actions 会自动重新部署。

### Q: 部署失败？

1. 进入仓库的 **Actions** 标签页查看错误日志
2. 确保 `package-lock.json` 已提交
3. 确保仓库是 **Public**

---

## 八、文件说明

| 文件 | 说明 |
|------|------|
| `.github/workflows/deploy.yml` | GitHub Actions 自动部署配置 |
| `vite.config.ts` | 包含 `base` 路径配置 |
| `dist/` | 构建输出目录（自动生成） |
| `.gitignore` | Git 忽略文件配置 |

---

## 九、快速命令汇总

```bash
# 本地测试构建
GITHUB_PAGES=true npm run build

# 本地预览构建结果
npm run preview

# 提交并推送
git add . && git commit -m "Update" && git push
```