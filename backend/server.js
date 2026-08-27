const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '..', 'data', 'parts.json');
const OUTBOUND_FILE = path.join(__dirname, '..', 'data', 'outbound.json');
const OPERATION_LOG_FILE = path.join(__dirname, '..', 'data', 'operation-log.json');
const VISIT_LOG_FILE = path.join(__dirname, '..', 'data', 'visit-log.json');
const MAX_LOG_ENTRIES = 500;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const ADMIN_DIR = path.join(__dirname, '..', 'admin');
const OUTBOUND_DIR = path.join(__dirname, '..', 'outbound');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'shuishui8633';
const ADMIN_TOKEN = Buffer.from(ADMIN_PASSWORD).toString('base64');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '2mb' }));

// 访问日志中间（在静态文件之前）
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    logVisit(req);
  }
  next();
});

app.use(express.static(FRONTEND_DIR));
app.use('/admin', express.static(ADMIN_DIR));

function loadParts() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read parts data:', err);
    return [];
  }
}

function saveParts(parts) {
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(parts, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

function loadOutbounds() {
  try {
    if (!fs.existsSync(OUTBOUND_FILE)) {
      return [];
    }
    const data = fs.readFileSync(OUTBOUND_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read outbounds data:', err);
    return [];
  }
}

function saveOutbounds(outbounds) {
  const tempFile = `${OUTBOUND_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(outbounds, null, 2), 'utf8');
  fs.renameSync(tempFile, OUTBOUND_FILE);
}

function loadOperationLog() {
  try {
    if (!fs.existsSync(OPERATION_LOG_FILE)) {
      return [];
    }
    const data = fs.readFileSync(OPERATION_LOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read operation log:', err);
    return [];
  }
}

function saveOperationLog(logs) {
  const tempFile = `${OPERATION_LOG_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(logs, null, 2), 'utf8');
  fs.renameSync(tempFile, OPERATION_LOG_FILE);
}

function logOperation(type, partId, partName, changes) {
  const logs = loadOperationLog();
  const entry = {
    time: new Date().toISOString(),
    type,
    partId,
    partName,
    changes: changes || null
  };
  logs.unshift(entry);
  // 保留最近 500 条
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.length = MAX_LOG_ENTRIES;
  }
  saveOperationLog(logs);
}

function loadVisitLog() {
  try {
    if (!fs.existsSync(VISIT_LOG_FILE)) {
      return [];
    }
    const data = fs.readFileSync(VISIT_LOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read visit log:', err);
    return [];
  }
}

function saveVisitLog(logs) {
  const tempFile = `${VISIT_LOG_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(logs, null, 2), 'utf8');
  fs.renameSync(tempFile, VISIT_LOG_FILE);
}

function logVisit(req) {
  const logs = loadVisitLog();
  const entry = {
    time: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  };
  logs.unshift(entry);
  // 保留所有记录
  saveVisitLog(logs);
}

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function parsePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? Math.floor(price) : null;
}

function findMatchingPartIndex(parts, partName, specification) {
  return parts.findIndex((part) =>
    normalizeKey(part.partName) === normalizeKey(partName) &&
    normalizeKey(part.specification) === normalizeKey(specification)
  );
}

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function partsToCsv(parts) {
  const headers = ['编号', '品牌', '零件名称', '规格型号', '单位', '价格'];
  const rows = parts.map((part) => [
    part.id,
    part.brand,
    part.partName,
    part.specification,
    part.unit,
    part.marketPrice
  ]);

  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
}

function getAdminToken(req) {
  const authHeader = req.get('authorization') || '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1];
  }

  return req.query.token || '';
}

function requireAdmin(req, res, next) {
  if (getAdminToken(req) !== ADMIN_TOKEN) {
    return res.status(401).json({ error: '请先输入后台访问密码' });
  }

  next();
}

app.get('/', (req, res) => {
  logVisit(req);
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(ADMIN_DIR, 'index.html'));
});

app.use('/outbound', express.static(OUTBOUND_DIR));
app.get('/outbound', (req, res) => {
  res.sendFile(path.join(OUTBOUND_DIR, 'index.html'));
});

app.get('/api/parts', (req, res) => {
  res.json(loadParts());
});

app.post('/api/admin/login', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '密码错误' });
  }

  res.json({ token: ADMIN_TOKEN });
});

app.get('/api/parts/export.json', requireAdmin, (req, res) => {
  const parts = loadParts();
  const filename = `parts-database-${new Date().toISOString().slice(0, 10)}.json`;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(parts, null, 2));
});

app.get('/api/parts/export.csv', requireAdmin, (req, res) => {
  const parts = loadParts();
  const filename = `parts-database-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`\ufeff${partsToCsv(parts)}`);
});

app.get('/api/parts/search', (req, res) => {
  const { keyword, brand } = req.query;
  let parts = loadParts();

  if (keyword) {
    const lowerKeyword = String(keyword).toLowerCase();
    parts = parts.filter((part) =>
      String(part.partName || '').toLowerCase().includes(lowerKeyword) ||
      String(part.specification || '').toLowerCase().includes(lowerKeyword)
    );
  }

  if (brand) {
    parts = parts.filter((part) => part.brand === brand);
  }

  res.json(parts);
});

app.post('/api/parts', requireAdmin, (req, res) => {
  const parts = loadParts();
  const partName = cleanText(req.body.partName);
  const specification = cleanText(req.body.specification);
  const brand = cleanText(req.body.brand) || '山河智能';
  const unit = cleanText(req.body.unit) || 'PCS';
  const marketPrice = parsePrice(req.body.marketPrice);

  if (!partName) {
    return res.status(400).json({ error: '请输入零件名称' });
  }

  if (!specification) {
    return res.status(400).json({ error: '请输入规格型号' });
  }

  if (marketPrice === null) {
    return res.status(400).json({ error: '请输入有效价格' });
  }

  const existingIndex = findMatchingPartIndex(parts, partName, specification);
  if (existingIndex !== -1) {
    parts[existingIndex] = {
      ...parts[existingIndex],
      brand,
      partName,
      specification,
      unit,
      marketPrice
    };

    saveParts(parts);
    logOperation('编辑', parts[existingIndex].id, partName, null);
    return res.json({ ...parts[existingIndex], updatedExisting: true });
  }

  const newPart = {
    id: parts.length > 0 ? Math.max(...parts.map((part) => part.id)) + 1 : 1,
    brand,
    partName,
    specification,
    unit,
    marketPrice
  };

  parts.push(newPart);
  saveParts(parts);
  logOperation('新增', newPart.id, partName, null);
  res.status(201).json({ ...newPart, updatedExisting: false });
});

app.put('/api/parts/:id', requireAdmin, (req, res) => {
  const parts = loadParts();
  const index = parts.findIndex((part) => part.id === parseInt(req.params.id, 10));

  if (index === -1) {
    return res.status(404).json({ error: '未找到该零件' });
  }

  const nextPartName = req.body.partName === undefined ? parts[index].partName : cleanText(req.body.partName);
  const nextSpecification = req.body.specification === undefined ? parts[index].specification : cleanText(req.body.specification);
  const nextMarketPrice = req.body.marketPrice === undefined ? parts[index].marketPrice : parsePrice(req.body.marketPrice);

  if (!nextPartName) {
    return res.status(400).json({ error: '请输入零件名称' });
  }

  if (!nextSpecification) {
    return res.status(400).json({ error: '请输入规格型号' });
  }

  if (nextMarketPrice === null) {
    return res.status(400).json({ error: '请输入有效价格' });
  }

  const oldPart = { ...parts[index] };

  parts[index] = {
    ...parts[index],
    brand: req.body.brand === undefined ? parts[index].brand : cleanText(req.body.brand) || '山河智能',
    partName: nextPartName,
    specification: nextSpecification,
    unit: req.body.unit === undefined ? parts[index].unit : cleanText(req.body.unit) || 'PCS',
    marketPrice: nextMarketPrice
  };

  saveParts(parts);

  // 记录旧值→新值
  const changes = {};
  for (const key of ['partName', 'specification', 'brand', 'unit', 'marketPrice']) {
    if (String(oldPart[key] ?? '') !== String(parts[index][key] ?? '')) {
      changes[key] = { old: oldPart[key], new: parts[index][key] };
    }
  }
  logOperation('编辑', parts[index].id, nextPartName, changes);

  res.json(parts[index]);
});

app.delete('/api/parts/:id', requireAdmin, (req, res) => {
  const parts = loadParts();
  const targetPart = parts.find((part) => part.id === parseInt(req.params.id, 10));
  const deletedPartName = targetPart ? targetPart.partName : '未知';
  const deletedPartId = parseInt(req.params.id, 10);

  const filtered = parts.filter((part) => part.id !== deletedPartId);

  if (filtered.length === parts.length) {
    return res.status(404).json({ error: '未找到该零件' });
  }

  saveParts(filtered);
  logOperation('删除', deletedPartId, deletedPartName, null);
  res.json({ success: true });
});

// 出库单 API
app.get('/api/outbound', (req, res) => {
  const outbounds = loadOutbounds();
  // 按创建时间倒序排列
  outbounds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(outbounds);
});

app.get('/api/outbound/:id', (req, res) => {
  const outbounds = loadOutbounds();
  const outbound = outbounds.find(item => item.id === req.params.id);
  
  if (!outbound) {
    return res.status(404).json({ error: '未找到该出库单' });
  }
  
  res.json(outbound);
});

app.post('/api/outbound', (req, res) => {
  const outbounds = loadOutbounds();
  const newOutbound = req.body;
  
  // 验证必填字段
  if (!newOutbound.id) {
    return res.status(400).json({ error: '缺少出库单号' });
  }
  
  if (!newOutbound.items || newOutbound.items.length === 0) {
    return res.status(400).json({ error: '出库单必须包含至少一个配件' });
  }
  
  // 检查单号是否已存在
  const exists = outbounds.find(item => item.id === newOutbound.id);
  if (exists) {
    return res.status(400).json({ error: '出库单号已存在' });
  }
  
  outbounds.push(newOutbound);
  saveOutbounds(outbounds);
  
  res.json({ success: true, id: newOutbound.id });
});

app.delete('/api/outbound/:id', (req, res) => {
  const outbounds = loadOutbounds();
  const filtered = outbounds.filter(item => item.id !== req.params.id);
  
  if (filtered.length === outbounds.length) {
    return res.status(404).json({ error: '未找到该出库单' });
  }
  
  saveOutbounds(filtered);
  res.json({ success: true });
});

// 操作日志 API
app.get('/api/operation-log', requireAdmin, (req, res) => {
  const logs = loadOperationLog();
  res.json(logs);
});

// 导入配件数据
app.post('/api/parts/import', requireAdmin, (req, res) => {
  const parts = loadParts();
  const importData = req.body;
  
  if (!Array.isArray(importData)) {
    return res.status(400).json({ error: '导入数据格式错误' });
  }
  
  let importCount = 0;
  const errors = [];
  
  for (let i = 0; i < importData.length; i++) {
    const item = importData[i];
    const partName = cleanText(item.partName);
    const specification = cleanText(item.specification);
    const brand = cleanText(item.brand) || '山河智能';
    const unit = cleanText(item.unit) || 'PCS';
    const marketPrice = parsePrice(item.marketPrice);
    
    // 校验必填字段
    if (!partName) {
      errors.push(`第 ${i + 1} 行：零件名称不能为空`);
      continue;
    }
    
    if (!specification) {
      errors.push(`第 ${i + 1} 行：规格型号不能为空`);
      continue;
    }
    
    if (marketPrice === null) {
      errors.push(`第 ${i + 1} 行：价格必须是大于等于0的数字`);
      continue;
    }
    
    // 检查是否已存在
    const existingIndex = findMatchingPartIndex(parts, partName, specification);
    if (existingIndex !== -1) {
      // 已存在，跳过
      continue;
    }
    
    // 新增配件
    const newPart = {
      id: parts.length > 0 ? Math.max(...parts.map(p => p.id)) + 1 : 1,
      brand,
      partName,
      specification,
      unit,
      marketPrice
    };
    
    parts.push(newPart);
    importCount++;
    logOperation('导入', newPart.id, partName, null);
  }
  
  if (importCount > 0) {
    saveParts(parts);
  }
  
  res.json({
    success: true,
    count: importCount,
    errors: errors.length > 0 ? errors : undefined
  });
});

// 访问统计 API
app.get('/api/visit-stats', requireAdmin, (req, res) => {
  const logs = loadVisitLog();
  
  // 总访问量
  const totalVisits = logs.length;
  
  // 今日访问量
  const today = new Date().toISOString().split('T')[0];
  const todayVisits = logs.filter(log => log.time.startsWith(today)).length;
  
  // 独立访客数（按IP去重）
  const uniqueIPs = new Set(logs.map(log => log.ip)).size;
  
  // 按日期统计（最近7天）
  const last7Days = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last7Days[dateStr] = 0;
  }
  
  logs.forEach(log => {
    const date = log.time.split('T')[0];
    if (last7Days[date] !== undefined) {
      last7Days[date]++;
    }
  });
  
  res.json({
    totalVisits,
    todayVisits,
    uniqueIPs,
    last7Days
  });
});

// 访问统计 API
app.get('/api/visit-log', requireAdmin, (req, res) => {
  const logs = loadVisitLog();
  res.json(logs);
});

app.listen(PORT, () => {
  console.log(`Parts quote system running at http://localhost:${PORT}`);
  console.log(`Admin page: http://localhost:${PORT}/admin`);
  console.log(`Data file: ${DATA_FILE}`);
});
