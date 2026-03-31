# Dockerfile 校验器规则库扩展计划

## 一、当前已实现的规则

| 规则ID | 指令 | 描述 | 级别 | 状态 |
|--------|------|------|------|------|
| DF001 | FROM | FROM 必须在第一条非注释行 | error | ✅ 已实现 |
| DF002 | 全局 | Dockerfile 必须包含 FROM 指令 | error | ✅ 已实现 |
| DF003 | 全局 | 未知指令检测 | error | ✅ 已实现 |
| DF004 | 全局 | 指令拼写错误检测 | error | ✅ 已实现 |
| DF005 | 全局 | 一行多指令错误检测 | error | ✅ 已实现 |
| DF006 | FROM | 缺少镜像名称 | error | ✅ 已实现 |
| DF007 | FROM | latest 标签警告 | warning | ✅ 已实现 |
| DF008 | FROM | 镜像名使用变量提示 | warning | ✅ 已实现 |
| DF009 | RUN | apt-get install 缓存清理建议 | info | ✅ 已实现 |
| DF010 | RUN | apk add --no-cache 建议 | info | ✅ 已实现 |
| DF011 | RUN | curl/wget 管道执行安全警告 | warning | ✅ 已实现 |
| DF012 | CMD/ENTRYPOINT | JSON 数组单引号错误 | error | ✅ 已实现 |
| DF013 | CMD/ENTRYPOINT | 方括号/双引号匹配检查 | error | ✅ 已实现 |
| DF014 | CMD/ENTRYPOINT | 重复指令警告 | warning | ✅ 已实现 |
| DF015 | EXPOSE | 端口号格式和范围验证 | error | ✅ 已实现 |
| DF016 | WORKDIR | 缺少目录路径 | error | ✅ 已实现 |
| DF017 | WORKDIR | 绝对路径建议 | warning | ✅ 已实现 |
| DF018 | COPY | 格式检查 | error | ✅ 已实现 |
| DF019 | COPY | --from 引用检查 | error | ✅ 已实现 |
| DF020 | ADD | 格式检查 | error | ✅ 已实现 |
| DF021 | ADD | URL 下载警告 | warning | ✅ 已实现 |
| DF022 | ENV | 敏感信息检测 | warning | ✅ 已实现 |
| DF023 | USER | root 用户警告 | warning | ✅ 已实现 |
| DF024 | 全局 | 连续空行过多 | info | ✅ 已实现 |

---

## 二、待实现的规则（按优先级排序）

### 🔴 高优先级 - 安全/错误相关（必须实现）

| 规则ID | 参考规则 | 指令 | 描述 | 级别 | 复杂度 |
|--------|----------|------|------|------|--------|
| DF101 | DL4000 | MAINTAINER | MAINTAINER 已废弃，应使用 LABEL maintainer= | warning | 低 |
| DF102 | DL3001 | RUN | 不建议使用 SSH | warning | 中 |
| DF103 | DL3004 | RUN | 不建议使用 sudo，应使用 USER 指令 | warning | 中 |
| DF104 | DL3005 | RUN | apt-get update 不应单独运行（应与 install 合并） | warning | 中 |
| DF105 | DL3006 | FROM | 多阶段构建中后续 FROM 应指定明确 tag | warning | 低 |
| DF106 | DL3008 | RUN | apt-get install 应固定包版本 | warning | 中 |
| DF107 | DL3013 | RUN | pip install 应固定包版本或使用 requirements.txt | warning | 中 |
| DF108 | DL3014 | RUN | apt-get install 应使用 -y 标志 | warning | 低 |
| DF109 | DL3015 | RUN | apt-get install 后应清理不需要的包 | info | 低 |
| DF110 | DL3016 | RUN | npm install 应固定版本或使用 package-lock.json | warning | 中 |
| DF111 | DL3018 | RUN | apk add 应固定包版本 | warning | 中 |
| DF112 | DL3020 | COPY | COPY 应使用 --chown 指定文件所有者 | info | 低 |
| DF113 | DL3022 | ADD | ADD 应使用 --chown 指定文件所有者 | info | 低 |
| DF114 | DL3025 | ENTRYPOINT | 不建议使用 shell 格式 | warning | 低 |
| DF115 | DL3048 | RUN | 不应使用 rm -rf / 或 rm -rf /* | warning | 低 |
| DF116 | HEALTHCHECK | HEALTHCHECK | HEALTHCHECK 格式验证 | error | 中 |
| DF117 | SHELL | SHELL | SHELL 指令格式验证 | error | 中 |
| DF118 | STOPSIGNAL | STOPSIGNAL | 信号格式验证（SIGTERM 或数字） | error | 低 |
| DF119 | DL4005 | CMD | CMD 不应使用 SHELL 格式（建议 JSON 格式） | warning | 低 |
| DF120 | DL3002 | USER | 最后一个 USER 不应是 root | warning | 中 |

### 🟡 中优先级 - 最佳实践相关

| 规则ID | 参考规则 | 指令 | 描述 | 级别 | 复杂度 |
|--------|----------|------|------|------|--------|
| DF201 | DL4001 | RUN | wget/curl 后应区分文件类型 | info | 低 |
| DF202 | DL3009 | RUN | apt-get list 存在说明未清理缓存 | info | 低 |
| DF203 | DL3026 | RUN | npm ci 比 npm install 更适合 CI 环境 | info | 低 |
| DF204 | DL3027 | RUN | 不建议使用 rpm 命令 | warning | 低 |
| DF205 | DL3028 | RUN | yum install 应清理缓存 | info | 中 |
| DF206 | DL3030 | RUN | yum 应使用 clean all | info | 低 |
| DF207 | DL3032 | RUN | yum 应使用 -y 标志 | warning | 低 |
| DF208 | DL3033 | RUN | yum 应指定包版本 | warning | 中 |
| DF209 | DL3034-3041 | RUN | dnf/zypper 包管理器检查 | info | 中 |
| DF210 | DL3046 | RUN | wget 应指定版本 | warning | 中 |
| DF211 | DL3047 | RUN | wget 应使用 --check-certificate | warning | 低 |
| DF212 | DL3059 | RUN | 多行 RUN 应使用续行符 | info | 低 |
| DF213 | 全局 | RUN | cd 命令应改用 WORKDIR | warning | 低 |
| DF214 | 全局 | 多阶段 | COPY --from 不应引用自身阶段 | error | 中 |
| DF215 | VOLUME | VOLUME | VOLUME 应指定绝对路径 | warning | 低 |
| DF216 | ARG | ARG | ARG 格式验证 | warning | 低 |
| DF217 | ARG | ARG | ARG 在 FROM 前后作用域检查 | warning | 中 |
| DF218 | LABEL | LABEL | LABEL 格式验证（key=value） | warning | 低 |
| DF219 | ONBUILD | ONBUILD | ONBUILD 不应与 FROM 组合 | warning | 低 |
| DF220 | 全局 | 多阶段 | 多阶段构建标签重复检查 | warning | 中 |

### 🟢 低优先级 - 风格/优化相关

| 规则ID | 参考规则 | 指令 | 描述 | 级别 | 复杂度 |
|--------|----------|------|------|------|--------|
| DF301 | DL3051 | LABEL | LABEL 重复定义检测 | warning | 低 |
| DF302 | DL3052 | ARG | ARG 重复定义检测 | warning | 低 |
| DF303 | DL3053 | ENV | ENV 重复定义检测 | warning | 低 |
| DF304 | DL3055 | EXPOSE | EXPOSE 端口重复检测 | warning | 低 |
| DF305 | DL3054 | CMD | CMD 命令长度限制建议 | info | 低 |
| DF306 | DL3056 | SHELL | SHELL 不应为空 | error | 低 |
| DF307 | DL3057 | ONBUILD | ONBUILD 不应触发自身 | error | 低 |
| DF308 | DL3058 | ADD | ADD 不应用于本地 tar 文件 | warning | 低 |
| DF309 | 全局 | 格式 | 续行符（\）格式检查 | error | 中 |
| DF310 | 全局 | 格式 | 指令前后空格检查 | info | 低 |
| DF311 | 全局 | 优化 | 连续 RUN 指令合并建议 | info | 中 |
| DF312 | 全局 | 优化 | 指令顺序优化（缓存优化） | info | 高 |
| DF313 | 全局 | 格式 | 指令大写一致性检查 | info | 低 |
| DF314 | 全局 | 格式 | 注释格式规范 | info | 低 |

---

## 三、实现计划

### 阶段一：核心安全规则（预计工作量：2天）

**目标**：覆盖最重要的安全和错误检测规则

| 序号 | 规则ID | 描述 | 预计时间 |
|------|--------|------|----------|
| 1 | DF101 | MAINTAINER 废弃警告 | 0.5h |
| 2 | DF103 | sudo 使用警告 | 1h |
| 3 | DF104 | apt-get update 单独运行警告 | 1h |
| 4 | DF108 | apt-get install -y 标志 | 0.5h |
| 5 | DF109 | apt-get install 清理不需要的包 | 0.5h |
| 6 | DF112 | COPY --chown 建议 | 0.5h |
| 7 | DF113 | ADD --chown 建议 | 0.5h |
| 8 | DF115 | rm -rf / 警告 | 0.5h |
| 9 | DF116 | HEALTHCHECK 格式验证 | 2h |
| 10 | DF118 | STOPSIGNAL 格式验证 | 0.5h |
| 11 | DF120 | 最后一个 USER 不应是 root | 1h |

### 阶段二：包管理器规则（预计工作量：1.5天）

**目标**：覆盖主流包管理器的最佳实践

| 序号 | 规则ID | 描述 | 预计时间 |
|------|--------|------|----------|
| 1 | DF106 | apt-get install 固定版本 | 1.5h |
| 2 | DF107 | pip install 固定版本 | 1h |
| 3 | DF110 | npm install 固定版本 | 1h |
| 4 | DF111 | apk add 固定版本 | 1h |
| 5 | DF102 | SSH 使用警告 | 0.5h |
| 6 | DF202 | apt 缓存检测 | 1h |
| 7 | DF203 | npm ci 建议 | 0.5h |
| 8 | DF205-209 | yum/dnf/zypper 检查 | 2h |

### 阶段三：格式验证规则（预计工作量：1天）

**目标**：完善各指令的格式验证

| 序号 | 规则ID | 描述 | 预计时间 |
|------|--------|------|----------|
| 1 | DF114 | ENTRYPOINT shell 格式警告 | 0.5h |
| 2 | DF119 | CMD shell 格式警告 | 0.5h |
| 3 | DF117 | SHELL 格式验证 | 1h |
| 4 | DF213 | cd 改 WORKDIR 建议 | 0.5h |
| 5 | DF214 | COPY --from 自引用检查 | 1h |
| 6 | DF215 | VOLUME 路径检查 | 0.5h |
| 7 | DF216-218 | ARG/LABEL 格式验证 | 1.5h |
| 8 | DF219 | ONBUILD+FROM 组合警告 | 0.5h |

### 阶段四：最佳实践规则（预计工作量：1天）

**目标**：完善最佳实践建议

| 序号 | 规则ID | 描述 | 预计时间 |
|------|--------|------|----------|
| 1 | DF201 | wget/curl 文件类型区分 | 0.5h |
| 2 | DF210-212 | wget 版本和证书检查 | 1h |
| 3 | DF301-304 | 重复定义检测 | 1h |
| 4 | DF306-308 | 其他格式检查 | 1h |
| 5 | DF309 | 续行符检查 | 1h |
| 6 | DF311 | 连续 RUN 合并建议 | 1h |
| 7 | DF313 | 指令大写一致性 | 0.5h |

### 阶段五：高级优化规则（预计工作量：1天）

**目标**：实现缓存优化和高级检查

| 序号 | 规则ID | 描述 | 预计时间 |
|------|--------|------|----------|
| 1 | DF312 | 指令顺序优化建议 | 3h |
| 2 | DF220 | 多阶段构建检查 | 2h |
| 3 | DF217 | ARG 作用域检查 | 1.5h |
| 4 | DF310 | 指令空格检查 | 0.5h |
| 5 | DF314 | 注释格式规范 | 0.5h |

---

## 四、测试案例需求

每个新规则需要对应的测试案例：

1. **正例**：符合规则的正确写法
2. **反例**：违反规则的错误写法
3. **边界情况**：特殊情况测试

预计新增测试案例数量：**150-200个**

---

## 五、总体工作量估算

| 阶段 | 预计时间 | 规则数量 |
|------|----------|----------|
| 阶段一 | 2天 | 11个 |
| 阶段二 | 1.5天 | 8个 |
| 阶段三 | 1天 | 8个 |
| 阶段四 | 1天 | 7个 |
| 阶段五 | 1天 | 5个 |
| **总计** | **6.5天** | **39个新规则** |

---

## 六、注意事项

1. **规则冲突处理**：某些规则可能存在冲突，需要设置优先级
2. **性能考虑**：复杂规则（如指令顺序优化）需要优化性能
3. **可配置性**：考虑添加规则开关，允许用户禁用某些规则
4. **国际化**：错误消息支持多语言

---

## 七、参考资源

- [hadolint 规则文档](https://github.com/hadolint/hadolint)
- [Dockerfile 官方最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Dockerfile 参考文档](https://docs.docker.com/engine/reference/builder/)