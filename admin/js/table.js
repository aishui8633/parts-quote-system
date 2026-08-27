// 表格渲染和分页模块

const PAGE_SIZE = 20;

function renderTable() {
  const partsList = document.getElementById('partsList');
  const start = (currentPageNum - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageData = filteredParts.slice(start, end);

  if (pageData.length === 0) {
    partsList.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px;">无数据</td></tr>';
    return;
  }

  partsList.innerHTML = pageData.map(part => `
    <tr>
      <td>${part.id}</td>
      <td>${escapeHtml(part.partName || '')}</td>
      <td>${escapeHtml(part.specification || '')}</td>
      <td class="price">${formatPrice(part.marketPrice)}</td>
      <td class="actions">
        <button class="btn-edit" onclick="startEdit(${part.id})">编辑</button>
        <button class="btn-delete" onclick="deletePart(${part.id}, '${escapeHtml(part.partName || '').replace(/'/g, "\\'")}')">删除</button>
      </td>
    </tr>
  `).join('');
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(filteredParts.length / PAGE_SIZE) || 1;
  let html = '';

  // 上一页
  html += `<button ${currentPageNum === 1 ? 'disabled' : ''} onclick="goToPage(${currentPageNum - 1})">上一页</button>`;

  // 页码
  const maxButtons = 5;
  let startPage = Math.max(1, currentPageNum - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    html += `<button onclick="goToPage(1)">1</button>`;
    if (startPage > 2) html += `<span class="page-info">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="${i === currentPageNum ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="page-info">...</span>`;
    html += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  // 下一页
  html += `<button ${currentPageNum === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPageNum + 1})">下一页</button>`;

  pagination.innerHTML = html;
  document.getElementById('currentPage').textContent = currentPageNum;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredParts.length / PAGE_SIZE) || 1;
  if (page < 1 || page > totalPages) return;
  currentPageNum = page;
  renderTable();
  renderPagination();
}

// 暴露给全局
window.goToPage = goToPage;
