// 表单编辑模块

let editingPartId = null;

function startEdit(id) {
  const part = allParts.find(p => p.id === id);
  if (!part) return;

  const form = document.getElementById('partForm');
  editingPartId = id;
  
  form.partName.value = part.partName || '';
  form.specification.value = part.specification || '';
  form.marketPrice.value = part.marketPrice || '';
  form.brand.value = part.brand || '山河智能';
  form.unit.value = part.unit || 'PCS';

  document.getElementById('formTitle').textContent = '编辑零件';
  document.getElementById('submitButton').textContent = '更新零件';
  document.getElementById('cancelEditButton').style.display = 'block';
  
  const editBanner = document.getElementById('editBanner');
  document.getElementById('editId').textContent = id;
  document.getElementById('editName').textContent = part.partName || '';
  editBanner.classList.add('show');

  // 滚动到表单
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  const form = document.getElementById('partForm');
  editingPartId = null;
  form.reset();
  form.brand.value = '山河智能';
  form.unit.value = 'PCS';
  
  document.getElementById('formTitle').textContent = '新增零件';
  document.getElementById('submitButton').textContent = '保存到数据库';
  document.getElementById('cancelEditButton').style.display = 'none';
  document.getElementById('editBanner').classList.remove('show');
  setMessage('');
}

function initForm() {
  const form = document.getElementById('partForm');
  const submitButton = document.getElementById('submitButton');
  const cancelEditButton = document.getElementById('cancelEditButton');

  // 取消编辑
  cancelEditButton.addEventListener('click', () => {
    resetForm();
  });

  // 表单提交
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    setMessage('正在保存...');

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      let result;

      if (editingPartId) {
        result = await updatePart(editingPartId, payload);
        if (result.error) throw new Error(result.error);
        setMessage('零件信息已更新。');
        resetForm();
      } else {
        result = await createPart(payload);
        if (result.error) throw new Error(result.error);
        setMessage(result.updatedExisting ? '已更新已有零件信息。' : '已新增零件并写入数据库。');
        form.partName.value = '';
        form.specification.value = '';
        form.marketPrice.value = '';
        form.partName.focus();
      }

      await loadParts();
    } catch (err) {
      setMessage(err.message, true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

// 暴露给全局（表格按钮需要调用）
window.startEdit = startEdit;
