// 搜索筛选模块

let searchTimer = null;

function applyFilter() {
  const searchInput = document.getElementById('searchInput');
  const keyword = searchInput.value.trim().toLowerCase();
  
  if (!keyword) {
    filteredParts = [...allParts];
  } else {
    filteredParts = allParts.filter(part => {
      const name = String(part.partName || '').toLowerCase();
      const spec = String(part.specification || '').toLowerCase();
      return name.includes(keyword) || spec.includes(keyword);
    });
  }
  
  document.getElementById('filteredCount').textContent = filteredParts.length;
  currentPageNum = 1;
  renderTable();
  renderPagination();
}

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');

  // 搜索输入（防抖）
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchClear.style.display = searchInput.value ? 'block' : 'none';
      applyFilter();
    }, 300);
  });

  // 清除搜索
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    applyFilter();
  });
}
