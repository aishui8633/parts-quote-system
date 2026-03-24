# Docker Compose 部署指南

## 快速部署

### 1. 构建并启动

```bash
cd C:\Users\aishu\.openclaw\workspace\parts-quote-system
docker-compose up -d --build
```

### 2. 查看运行状态

```bash
docker-compose ps
docker-compose logs -f
```

### 3. 访问服务

浏览器打开：http://localhost:3000

## 常用命令

### 启动
```bash
docker-compose up -d
```

### 停止
```bash
docker-compose down
```

### 重启
```bash
docker-compose restart
```

### 查看日志
```bash
docker-compose logs -f
```

### 重新构建
```bash
docker-compose up -d --build
```

### 进入容器
```bash
docker exec -it sunward-parts-quote sh
```

## 数据更新

### 更新价格数据

数据文件挂载在 `./data` 目录，直接替换 `data/parts.json` 后重启：

```bash
# 替换 data/parts.json 文件
# ...

# 重启容器
docker-compose restart
```

### 备份数据
```bash
docker cp sunward-parts-quote:/app/data/parts.json ./backup_parts.json
```

## 生产环境部署

### 修改端口

编辑 `docker-compose.yml`，修改端口映射：

```yaml
ports:
  - "80:3000"  # 改为 80 端口
```

### 设置开机自启

```bash
# 启用 Docker 服务
sudo systemctl enable docker
sudo systemctl enable docker-compose

# 设置容器自启（已在配置中设置 restart: unless-stopped）
```

### Nginx 反向代理（可选）

如果需要 HTTPS 或负载均衡：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 故障排查

### 容器无法启动
```bash
docker-compose logs
docker-compose ps -a
```

### 端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :3000

# 修改 docker-compose.yml 中的端口映射
ports:
  - "3001:3000"  # 改为其他端口
```

### 数据丢失
```bash
# 检查数据卷挂载
docker inspect sunward-parts-quote | grep Mounts

# 恢复数据
docker cp ./parts.json sunward-parts-quote:/app/data/parts.json
docker-compose restart
```

## 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 内存：512MB+
- 磁盘：100MB+

## 镜像信息

- 基础镜像：node:18-alpine
- 镜像大小：约 150MB
- 启动时间：约 5 秒

---

**部署时间**: 2026-03-24
**版本**: v1.0
