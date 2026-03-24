# 山河智能配件查询报价系统 - Docker 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制后端依赖文件
COPY backend/package*.json ./backend/

# 安装后端依赖
RUN cd backend && npm install --production

# 复制项目文件
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY data/ ./data/

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "backend/server.js"]
