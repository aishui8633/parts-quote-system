// 主入口 - 初始化

// 全局状态变量
let allParts = [];
let filteredParts = [];
let currentPageNum = 1;

// 页面切换
function switchPage(pageName) {
  // 隐藏所有页面
  document.querySelectorAll('main[id^="page-"]').forEach(page => {
    page.classList.add('hidden');
  });
  
  // 显示目标页面
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }
  
  // 更新导航按钮状态
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.page === pageName) {
      btn.classList.add('active');
    }
  });
  
  // 切换到日志页面时加载日志
  if (pageName === 'log') {
    loadLogs();
  }
  
  // 切换到访问统计页面时加载数据
  if (pageName === 'visit') {
    loadVisitData();
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initSearch();
  initForm();
  initLog();
  initVisit();
  initImport();
  
  // 导航按钮点击事件
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchPage(btn.dataset.page);
    });
  });

  // 检查是否已登录
  if (getToken()) {
    setAuthState(true);
    loadParts().catch((err) => {
      localStorage.removeItem(TOKEN_KEY);
      setAuthState(false);
      setLoginMessage(`请重新登录：${err.message}`, true);
    });
  } else {
    setAuthState(false);
    document.getElementById('adminPassword').focus();
  }
});
