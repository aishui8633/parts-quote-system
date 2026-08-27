// 导入功能
let importedData = [];
let duplicateData = [];

// 初始化导入功能
function initImport() {
  const importBtn = document.getElementById('importBtn');
  const importModal = document.getElementById('importModal');
  const importModalClose = document.getElementById('importModalClose');
  const importCancelBtn = document.getElementById('importCancelBtn');
  const importConfirmBtn = document.getElementById('importConfirmBtn');
  const fileInput = document.getElementById('fileInput');

  // 打开导入模态框
  importBtn.addEventListener('click', () => {
    importModal.classList.remove('hidden');
    resetImportModal();
  });

  // 关闭模态框
  importModalClose.addEventListener('click', () => {
    importModal.classList.add('hidden');
  });

  importCancelBtn.addEventListener('click', () => {
    importModal.classList.add('hidden');
  });

  // 点击模态框外部关闭
  importModal.addEventListener('click', (e) => {
    if (e.target === importModal) {
      importModal.classList.add('hidden');
    }
  });

  // 文件选择
  fileInput.addEventListener('change', handleFileSelect);

  // 确认导入
  importConfirmBtn.addEventListener('click', confirmImport);
}

// 重置模态框
function resetImportModal() {
  const fileInput = document.getElementById('fileInput');
  const importStep1 = document.getElementById('importStep1');
  const importStep2 = document.getElementById('importStep2');
  const importPreview = document.getElementById('importPreview');
  const importConfirmBtn = document.getElementById('importConfirmBtn');

  fileInput.value = '';
  importStep1.classList.remove('hidden');
  importStep2.classList.add('hidden');
  importPreview.classList.add('hidden');
  importConfirmBtn.classList.add('hidden');
  importConfirmBtn.disabled = true;
  importedData = [];
  duplicateData = [];
}

// 处理文件选择
async function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const importStep1 = document.getElementById('importStep1');
  const importStep2 = document.getElementById('importStep2');
  const importResult = document.getElementById('importResult');
  const importPreview = document.getElementById('importPreview');
  const importConfirmBtn = document.getElementById('importConfirmBtn');

  importStep1.classList.add('hidden');
  importStep2.classList.remove('hidden');
  importResult.innerHTML = '<p>正在读取文件...</p>';

  try {
    // 读取 Excel 文件
    const data = await readFile(file);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    // 解析数据
    const parsedData = parseExcelData(jsonData);
    
    if (parsedData.errors.length > 0) {
      // 有错误
      importResult.innerHTML = `
        <div class="import-result error">
          <strong>数据校验失败</strong>
          <p>发现 ${parsedData.errors.length} 个错误，请修正后重新导入</p>
        </div>
        <div class="import-errors">
          <h4>错误详情：</h4>
          <ul>
            ${parsedData.errors.map(err => `<li>第 ${err.row} 行：${err.message}</li>`).join('')}
          </ul>
        </div>
      `;
      return;
    }

    importedData = parsedData.data;

    // 检查重复
    duplicateData = checkDuplicates(importedData);
    
    if (duplicateData.length > 0) {
      // 有重复
      importResult.innerHTML = `
        <div class="import-result warning">
          <strong>发现重复数据</strong>
          <p>检测到 ${duplicateData.length} 条重复数据（名称+规格相同），这些将被跳过</p>
        </div>
        <div class="import-errors">
          <h4>重复数据：</h4>
          <ul>
            ${duplicateData.map(item => `<li>${item.partName} - ${item.specification}</li>`).join('')}
          </ul>
        </div>
      `;
      
      // 过滤掉重复数据
      const newData = importedData.filter(item => 
        !duplicateData.some(dup => 
          dup.partName === item.partName && dup.specification === item.specification
        )
      );
      importedData = newData;
    }

    if (importedData.length === 0) {
      importResult.innerHTML = `
        <div class="import-result error">
          <strong>没有可导入的数据</strong>
          <p>所有数据都是重复的或无效的</p>
        </div>
      `;
      return;
    }

    // 显示成功信息和预览
    importResult.innerHTML = `
      <div class="import-result success">
        <strong>数据校验通过</strong>
        <p>共 ${importedData.length} 条数据可以导入${duplicateData.length > 0 ? `，${duplicateData.length} 条重复数据将被跳过` : ''}</p>
      </div>
    `;

    // 显示预览
    importPreview.classList.remove('hidden');
    const previewBody = document.getElementById('previewBody');
    previewBody.innerHTML = importedData.slice(0, 10).map(item => `
      <tr>
        <td>${item.partName}</td>
        <td>${item.specification}</td>
        <td>¥${item.marketPrice.toFixed(2)}</td>
      </tr>
    `).join('');

    if (importedData.length > 10) {
      previewBody.innerHTML += `
        <tr>
          <td colspan="3" style="text-align: center; color: #6b7280;">
            ... 还有 ${importedData.length - 10} 条数据
          </td>
        </tr>
      `;
    }

    // 启用确认按钮
    importConfirmBtn.classList.remove('hidden');
    importConfirmBtn.disabled = false;

  } catch (error) {
    importResult.innerHTML = `
      <div class="import-result error">
        <strong>文件读取失败</strong>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// 读取文件
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(new Uint8Array(e.target.result));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

// 解析 Excel 数据
function parseExcelData(jsonData) {
  const data = [];
  const errors = [];

  // 跳过表头（如果第一行是"零件名称"则跳过）
  let startIndex = 0;
  if (jsonData.length > 0 && jsonData[0][0] === '零件名称') {
    startIndex = 1;
  }

  for (let i = startIndex; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const partName = row[0] ? String(row[0]).trim() : '';
    const specification = row[1] ? String(row[1]).trim() : '';
    const marketPrice = row[2];

    // 校验
    if (!partName) {
      errors.push({ row: i + 1, message: '零件名称不能为空' });
      continue;
    }

    if (!specification) {
      errors.push({ row: i + 1, message: '规格型号不能为空' });
      continue;
    }

    const price = parseFloat(marketPrice);
    if (isNaN(price) || price < 0) {
      errors.push({ row: i + 1, message: '价格必须是大于等于0的数字' });
      continue;
    }

    data.push({
      partName,
      specification,
      marketPrice: price,
      brand: '山河智能',
      unit: 'PCS'
    });
  }

  return { data, errors };
}

// 检查重复数据
function checkDuplicates(newData) {
  const duplicates = [];
  const uniqueData = [];
  
  // 先处理文件内重复：保留第一条
  const seen = new Set();
  for (const item of newData) {
    const key = `${item.partName}|${item.specification}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueData.push(item);
    }
  }
  
  // 再检查与现有数据重复
  for (const item of uniqueData) {
    const existingPart = allParts.find(p => 
      p.partName === item.partName && 
      p.specification === item.specification
    );
    
    if (existingPart) {
      duplicates.push(item);
    }
  }

  return duplicates;
}

// 确认导入
async function confirmImport() {
  const importConfirmBtn = document.getElementById('importConfirmBtn');
  const importResult = document.getElementById('importResult');
  
  importConfirmBtn.disabled = true;
  importConfirmBtn.textContent = '导入中...';

  try {
    const response = await fetch('/api/parts/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify(importedData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '导入失败');
    }

    // 显示成功信息
    importResult.innerHTML = `
      <div class="import-result success">
        <strong>导入成功</strong>
        <p>成功导入 ${result.count} 条数据</p>
      </div>
    `;

    // 刷新数据
    await loadParts();

    // 2秒后关闭模态框
    setTimeout(() => {
      document.getElementById('importModal').classList.add('hidden');
    }, 2000);

  } catch (error) {
    importResult.innerHTML = `
      <div class="import-result error">
        <strong>导入失败</strong>
        <p>${error.message}</p>
      </div>
    `;
    importConfirmBtn.disabled = false;
    importConfirmBtn.textContent = '确认导入';
  }
}
