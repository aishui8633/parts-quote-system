// 操作日志模块

let allLogs = [];
let filteredLogs = [];

// 格式化时间
function formatTime(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取类型徽章
function getTypeBadge(type) {
  const classes = {
    '新增': 'add',
    '编辑': 'edit',
    '删除': 'delete'
  };
  const className = classes[type] || 'add';
  return `<span class="type-badge ${className}">${type}</span>`;
}

// 渲染变更详情
function renderChanges(changes) {
  if (!changes || Object.keys(changes).length === 0) {
    return '-';
  }
  
  let html = '<details><summary>查看变更</summary>';
  for (const [key, value] of Object.entries(changes)) {
    const oldVal = value.old === null || value.old === undefined ? '-' : value.old;
    const newVal = value.new === null || value.new === undefined ? '-' : value.new;
    html += `<div class="change-item">
      <strong>${key}:</strong> 
      <span class="old">${oldVal}</span> → 
      <span class="new">${newVal}</span>
    </div>`;
  }
  html += '</details>';
  return html;
}

// 渲染日志表格
function renderLogTable() {
  const logList = document.getElementById('logList');
  
  if (filteredLogs.length === 0) {
    logList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 40px;">暂无日志记录</td></tr>';
    return;
  }
  
  logList.innerHTML = filteredLogs.map(log => `
    <tr>
      <td>${formatTime(log.time)}</td>
      <td>${getTypeBadge(log.type)}</td>
      <td>#${log.partId}</td>
      <td>${escapeHtml(log.partName)}</td>
      <td class="changes-cell">${renderChanges(log.changes)}</td>
    </tr>
  `).join('');
}

// 应用筛选
function applyLogFilter() {
  const typeFilter = document.getElementById('logTypeFilter').value;
  
  if (!typeFilter) {
    filteredLogs = [...allLogs];
  } else {
    filteredLogs = allLogs.filter(log => log.type === typeFilter);
  }
  
  renderLogTable();
}

// 加载日志
async function loadLogs() {
  try {
    const response = await fetch('/api/operation-log', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('加载日志失败');
    }
    
    allLogs = await response.json();
    applyLogFilter();
  } catch (error) {
    console.error('加载日志失败:', error);
  }
}

// 初始化日志模块
function initLog() {
  const typeFilter = document.getElementById('logTypeFilter');
  typeFilter.addEventListener('change', applyLogFilter);
}
