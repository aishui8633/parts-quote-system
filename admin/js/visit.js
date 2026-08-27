// 访问统计模块

let allVisits = [];

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

// 解析浏览器信息
function parseBrowser(userAgent) {
  if (!userAgent) return '未知';
  
  // 浏览器
  let browser = '未知';
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    browser = 'IE';
  }
  
  // 操作系统
  let os = '未知';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'MacOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }
  
  return `${browser} / ${os}`;
}

// 渲染访问记录表格
function renderVisitTable() {
  const visitList = document.getElementById('visitList');
  
  if (allVisits.length === 0) {
    visitList.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 40px;">暂无访问记录</td></tr>';
    return;
  }
  
  visitList.innerHTML = allVisits.map(visit => `
    <tr>
      <td>${formatTime(visit.time)}</td>
      <td>${visit.ip}</td>
      <td>${parseBrowser(visit.userAgent)}</td>
    </tr>
  `).join('');
}

// 渲染访问趋势图
function renderVisitChart(last7Days) {
  const chartContainer = document.getElementById('visitChart');
  const dates = Object.keys(last7Days);
  const values = Object.values(last7Days);
  const maxValue = Math.max(...values, 1);
  
  chartContainer.innerHTML = dates.map((date, index) => {
    const value = values[index];
    const height = (value / maxValue) * 150;
    const shortDate = date.substring(5); // MM-DD
    
    return `
      <div class="chart-bar" style="height: ${height}px;">
        <div class="chart-bar-value">${value}</div>
        <div class="chart-bar-label">${shortDate}</div>
      </div>
    `;
  }).join('');
}

// 加载访问统计
async function loadVisitStats() {
  try {
    const response = await fetch('/api/visit-stats', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('加载统计数据失败');
    }
    
    const stats = await response.json();
    document.getElementById('totalVisits').textContent = stats.totalVisits;
    document.getElementById('todayVisits').textContent = stats.todayVisits;
    document.getElementById('uniqueIPs').textContent = stats.uniqueIPs;
    renderVisitChart(stats.last7Days);
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 加载访问记录
async function loadVisitLog() {
  try {
    const response = await fetch('/api/visit-log', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('加载访问记录失败');
    }
    
    allVisits = await response.json();
    renderVisitTable();
  } catch (error) {
    console.error('加载访问记录失败:', error);
  }
}

// 初始化访问统计模块
function initVisit() {
  // 初始化时不加载数据，等切换到访问统计页面时再加载
}

// 暴露给外部调用
window.loadVisitData = function() {
  loadVisitStats();
  loadVisitLog();
};
