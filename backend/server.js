const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '..', 'data', 'parts.json');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const ADMIN_DIR = path.join(__dirname, '..', 'admin');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'shuishui8633';
const ADMIN_TOKEN = Buffer.from(ADMIN_PASSWORD).toString('base64');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(FRONTEND_DIR));

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
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(ADMIN_DIR, 'index.html'));
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

  parts[index] = {
    ...parts[index],
    brand: req.body.brand === undefined ? parts[index].brand : cleanText(req.body.brand) || '山河智能',
    partName: nextPartName,
    specification: nextSpecification,
    unit: req.body.unit === undefined ? parts[index].unit : cleanText(req.body.unit) || 'PCS',
    marketPrice: nextMarketPrice
  };

  saveParts(parts);
  res.json(parts[index]);
});

app.delete('/api/parts/:id', requireAdmin, (req, res) => {
  const parts = loadParts();
  const filtered = parts.filter((part) => part.id !== parseInt(req.params.id, 10));

  if (filtered.length === parts.length) {
    return res.status(404).json({ error: '未找到该零件' });
  }

  saveParts(filtered);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Parts quote system running at http://localhost:${PORT}`);
  console.log(`Admin page: http://localhost:${PORT}/admin`);
  console.log(`Data file: ${DATA_FILE}`);
});
