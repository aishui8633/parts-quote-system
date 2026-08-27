// 工具函数

function formatPrice(price) {
  return `¥${Math.floor(Number(price) || 0).toLocaleString()}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setMessage(text, isError = false) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.classList.toggle('error', isError);
}

function setLoginMessage(text, isError = false) {
  const loginMessage = document.getElementById('loginMessage');
  loginMessage.textContent = text;
  loginMessage.classList.toggle('error', isError);
}
