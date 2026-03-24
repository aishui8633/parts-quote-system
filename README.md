# 山河智能配件查询报价系统

> Sunward Parts Quote System - 简单实用的工业零件查询和报价系统

[![构建状态](https://github.com/yourusername/parts-quote-system/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/parts-quote-system/actions)
[![Docker Pulls](https://img.shields.io/docker/pulls/yourusername/parts-quote-system)](https://hub.docker.com/r/yourusername/parts-quote-system)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 项目简介

为山河智能配件提供的快速查询和报价系统，支持搜索、打印、导出等功能。

- **品牌**: 山河智能
- **零件类型**: 配件
- **数据记录**: 1202 条
- **技术栈**: Vue 3 + Express + Node.js + Docker

## ✨ 核心功能

- 🔍 **零件搜索** - 按零件名称或规格型号快速搜索
- 💰 **即时报价** - 显示当期含税牌价
- 🖨️ **打印报价单** - 一键打印，包含公司信息
- 📥 **导出 CSV** - 导出报价数据到 Excel
- 💾 **搜索记忆** - 自动保存上次搜索
- 📱 **响应式设计** - 支持手机、平板、桌面端

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/yourusername/parts-quote-system.git
cd parts-quote-system

# 启动服务
docker-compose up -d

# 访问服务
# http://localhost:3000
```

### 方式二：本地运行

```bash
# 安装依赖
cd backend
npm install

# 启动服务
npm start

# 访问服务
# http://localhost:3000
```

## 📁 项目结构

```
parts-quote-system/
├── .github/workflows/       # GitHub Actions
├── backend/                 # 后端服务
│   ├── server.js           # Express 服务器
│   └── package.json        # 依赖配置
├── frontend/               # 前端页面
│   ├── index.html          # 主页面
│   └── logo.png            # Logo
├── data/                   # 数据文件
│   └── parts.json          # 零件数据
├── docker-compose.yml      # Docker 编排
├── Dockerfile             # Docker 镜像
└── README.md              # 项目说明
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3000 |
| NODE_ENV | 运行环境 | production |

### Docker 部署

```bash
# 构建镜像
docker build -t parts-quote-system .

# 运行容器
docker run -d -p 3000:3000 --name parts-quote parts-quote-system

# 查看日志
docker logs -f parts-quote
```

## 📊 数据统计

- 零件总数：1202 条
- 价格范围：¥1.00 - ¥166,140.00
- 品牌：山河智能
- 单位：PCS

## 🛠️ 开发指南

### 添加新零件

编辑 `data/parts.json`：

```json
{
  "id": 1203,
  "brand": "山河智能",
  "partName": "新零件名称",
  "specification": "规格型号",
  "unit": "PCS",
  "marketPrice": 100
}
```

### 修改前端

编辑 `frontend/index.html`，刷新浏览器即可看到效果。

### 修改后端

编辑 `backend/server.js`，重启服务：

```bash
docker-compose restart
```

## 📱 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 前端页面 |
| `/api/parts` | GET | 获取所有零件 |
| `/api/parts/search?keyword=xxx` | GET | 搜索零件 |

## 🎨 设计规格

- **主色调**: #008D84（青绿色）
- **Logo**: 左上角独立显示
- **字体**: Microsoft YaHei
- **按钮**:
  - 打印：橙色（#FF6600）
  - 导出：深蓝（#003366）

## 📞 联系信息

- **公司**: 湖南正天机电设备有限公司
- **电话**: 18773158373

## 📄 许可证

MIT License

## 🙏 致谢

感谢使用山河智能配件查询报价系统！

---

**创建日期**: 2026-03-24  
**版本**: v1.0  
**状态**: ✅ 已交付使用
