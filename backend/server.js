const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 数据文件路径
const DATA_FILE = path.join(__dirname, '..', 'data', 'parts.json');

// 读取零件数据
function loadParts() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('读取数据失败:', err);
    return [];
  }
}

// 保存零件数据
function saveParts(parts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(parts, null, 2), 'utf8');
}

// 根路由 - 提供前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// API: 获取所有零件
app.get('/api/parts', (req, res) => {
  const parts = loadParts();
  res.json(parts);
});

// API: 搜索零件
app.get('/api/parts/search', (req, res) => {
  const { keyword, brand } = req.query;
  let parts = loadParts();
  
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    parts = parts.filter(p => 
      p.partName.toLowerCase().includes(lowerKeyword) ||
      p.specification.toLowerCase().includes(lowerKeyword)
    );
  }
  
  if (brand) {
    parts = parts.filter(p => p.brand === brand);
  }
  
  res.json(parts);
});

// API: 添加零件
app.post('/api/parts', (req, res) => {
  const parts = loadParts();
  const newPart = {
    id: parts.length > 0 ? Math.max(...parts.map(p => p.id)) + 1 : 1,
    brand: req.body.brand || '山河智能',
    partName: req.body.partName,
    specification: req.body.specification,
    unit: req.body.unit || 'PCS',
    marketPrice: Math.floor(parseFloat(req.body.marketPrice))
  };
  
  parts.push(newPart);
  saveParts(parts);
  res.json(newPart);
});

// API: 更新零件
app.put('/api/parts/:id', (req, res) => {
  const parts = loadParts();
  const index = parts.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: '零件未找到' });
  }
  
  parts[index] = {
    ...parts[index],
    partName: req.body.partName || parts[index].partName,
    specification: req.body.specification || parts[index].specification,
    marketPrice: req.body.marketPrice !== undefined ? Math.floor(parseFloat(req.body.marketPrice)) : parts[index].marketPrice
  };
  
  saveParts(parts);
  res.json(parts[index]);
});

// API: 删除零件
app.delete('/api/parts/:id', (req, res) => {
  const parts = loadParts();
  const filtered = parts.filter(p => p.id !== parseInt(req.params.id));
  
  if (filtered.length === parts.length) {
    return res.status(404).json({ error: '零件未找到' });
  }
  
  saveParts(filtered);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 配件报价系统后端运行在 http://localhost:${PORT}`);
  console.log(`📁 数据文件：${DATA_FILE}`);
});
