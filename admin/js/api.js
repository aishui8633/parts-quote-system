// API 调用封装

async function loadParts() {
  const response = await fetch('/api/parts');
  allParts = await response.json();
  // 按 ID 倒序排列，新增数据在最前面
  allParts.sort((a, b) => b.id - a.id);
  document.getElementById('partCount').textContent = allParts.length;
  applyFilter();
}

async function createPart(payload) {
  const response = await fetch('/api/parts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(payload)
  });
  return await response.json();
}

async function updatePart(id, payload) {
  const response = await fetch(`/api/parts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(payload)
  });
  return await response.json();
}

async function deletePart(id, name) {
  if (!confirm(`确定要删除「${name}」(编号 ${id}) 吗？\n此操作不可恢复！`)) return;

  try {
    const response = await fetch(`/api/parts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '删除失败');
    }

    setMessage(`已删除「${name}」`);
    await loadParts();
  } catch (err) {
    setMessage(err.message, true);
  }
}

// 暴露给全局（表格按钮需要调用）
window.deletePart = deletePart;
