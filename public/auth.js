/* 共享账号组件：头部登录状态 + 登录/注册弹窗 + 服务端自选列表读写
   页面集成：header 中放 <span id="authBox"></span>，在业务脚本前引入本文件。
   业务脚本通过 window.onAuthChange(user) 感知登录状态变化。 */
window.Auth = (function () {
  const TXT = {
    zh: {
      loginBtn: '登录 / 注册', logout: '退出', login: '登录', register: '注册',
      username: '用户名', password: '密码',
      userHint: '3-20 位字母、数字或下划线', pwHint: '至少 6 位',
      submitLogin: '登 录', submitReg: '注 册', cancel: '取消',
      err_invalid_username: '用户名需为 3-20 位字母、数字或下划线',
      err_invalid_password: '密码长度需在 6-64 位之间',
      err_user_exists: '该用户名已被注册',
      err_bad_credentials: '用户名或密码错误',
      err_not_logged_in: '请先登录',
      err_bad_request: '请求格式不正确',
      err_net: '网络错误，请重试',
    },
    en: {
      loginBtn: 'Sign in / Sign up', logout: 'Sign out', login: 'Sign in', register: 'Sign up',
      username: 'Username', password: 'Password',
      userHint: '3-20 letters, digits or _', pwHint: 'At least 6 characters',
      submitLogin: 'Sign in', submitReg: 'Sign up', cancel: 'Cancel',
      err_invalid_username: 'Username must be 3-20 letters, digits or underscores',
      err_invalid_password: 'Password must be 6-64 characters',
      err_user_exists: 'Username already taken',
      err_bad_credentials: 'Wrong username or password',
      err_not_logged_in: 'Please sign in first',
      err_bad_request: 'Invalid request',
      err_net: 'Network error, please retry',
    },
    tw: {
      loginBtn: '登入 / 註冊', logout: '登出', login: '登入', register: '註冊',
      username: '使用者名稱', password: '密碼',
      userHint: '3-20 位字母、數字或底線', pwHint: '至少 6 位',
      submitLogin: '登 入', submitReg: '註 冊', cancel: '取消',
      err_invalid_username: '使用者名稱需為 3-20 位字母、數字或底線',
      err_invalid_password: '密碼長度需在 6-64 位之間',
      err_user_exists: '該使用者名稱已被註冊',
      err_bad_credentials: '使用者名稱或密碼錯誤',
      err_not_logged_in: '請先登入',
      err_bad_request: '請求格式不正確',
      err_net: '網路錯誤，請重試',
    },
    ja: {
      loginBtn: 'ログイン / 登録', logout: 'ログアウト', login: 'ログイン', register: '新規登録',
      username: 'ユーザー名', password: 'パスワード',
      userHint: '3-20文字の英数字または _', pwHint: '6文字以上',
      submitLogin: 'ログイン', submitReg: '登録', cancel: 'キャンセル',
      err_invalid_username: 'ユーザー名は3-20文字の英数字またはアンダースコアで入力してください',
      err_invalid_password: 'パスワードは6-64文字で入力してください',
      err_user_exists: 'このユーザー名は既に使われています',
      err_bad_credentials: 'ユーザー名またはパスワードが違います',
      err_not_logged_in: '先にログインしてください',
      err_bad_request: 'リクエストが不正です',
      err_net: 'ネットワークエラー。再試行してください',
    },
    ko: {
      loginBtn: '로그인 / 가입', logout: '로그아웃', login: '로그인', register: '회원가입',
      username: '아이디', password: '비밀번호',
      userHint: '3-20자 영문·숫자·밑줄', pwHint: '6자 이상',
      submitLogin: '로그인', submitReg: '가입하기', cancel: '취소',
      err_invalid_username: '아이디는 3-20자의 영문, 숫자, 밑줄만 가능합니다',
      err_invalid_password: '비밀번호는 6-64자여야 합니다',
      err_user_exists: '이미 사용 중인 아이디입니다',
      err_bad_credentials: '아이디 또는 비밀번호가 올바르지 않습니다',
      err_not_logged_in: '먼저 로그인하세요',
      err_bad_request: '잘못된 요청입니다',
      err_net: '네트워크 오류. 다시 시도하세요',
    },
  };
  const lang = () => {
    const v = localStorage.getItem('lang');
    return TXT[v] ? v : 'en';
  };
  const tt = (k) => TXT[lang()][k];

  let user = null;
  let mode = 'login';

  async function api(path, body) {
    const opts = body === undefined ? {} :
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    const resp = await fetch(path, opts);
    return resp.json();
  }

  function notify() { if (typeof window.onAuthChange === 'function') window.onAuthChange(user); }

  /* ----- 头部状态渲染 ----- */
  function render() {
    const box = document.getElementById('authBox');
    if (!box) return;
    if (user) {
      box.innerHTML = `<span class="auth-user">👤 ${user.username}</span>
        <button class="link-btn" id="logoutBtn">${tt('logout')}</button>`;
      box.querySelector('#logoutBtn').onclick = doLogout;
    } else {
      box.innerHTML = `<button class="lang-btn" id="loginOpenBtn">${tt('loginBtn')}</button>`;
      box.querySelector('#loginOpenBtn').onclick = () => openModal('login');
    }
  }

  /* ----- 弹窗 ----- */
  function openModal(m) {
    mode = m;
    closeModal();
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.id = 'authModal';
    ov.innerHTML = `
      <div class="modal">
        <div class="tab-row">
          <button class="m-tab ${mode==='login'?'active':''}" data-m="login">${tt('login')}</button>
          <button class="m-tab ${mode==='register'?'active':''}" data-m="register">${tt('register')}</button>
        </div>
        <label class="m-label">${tt('username')}</label>
        <input id="authUser" class="m-input" autocomplete="username" placeholder="${tt('userHint')}">
        <label class="m-label">${tt('password')}</label>
        <input id="authPw" class="m-input" type="password" autocomplete="current-password" placeholder="${tt('pwHint')}">
        <div class="m-err" id="authErr"></div>
        <button class="m-submit" id="authSubmit">${mode==='login'?tt('submitLogin'):tt('submitReg')}</button>
        <button class="m-cancel" id="authCancel">${tt('cancel')}</button>
      </div>`;
    ov.addEventListener('click', (e) => { if (e.target === ov) closeModal(); });
    ov.querySelectorAll('.m-tab').forEach(b => b.onclick = () => openModal(b.dataset.m));
    ov.querySelector('#authCancel').onclick = closeModal;
    ov.querySelector('#authSubmit').onclick = submit;
    ov.querySelector('#authPw').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    document.body.appendChild(ov);
    ov.querySelector('#authUser').focus();
  }

  function closeModal() {
    const m = document.getElementById('authModal');
    if (m) m.remove();
  }

  async function submit() {
    const username = document.getElementById('authUser').value.trim();
    const password = document.getElementById('authPw').value;
    const errEl = document.getElementById('authErr');
    errEl.textContent = '';
    try {
      const d = await api(mode === 'login' ? '/api/login' : '/api/register', { username, password });
      if (d.error) { errEl.textContent = tt('err_' + d.error) || d.error; return; }
      user = d.user;
      closeModal();
      render();
      notify();
    } catch (e) {
      errEl.textContent = tt('err_net');
    }
  }

  async function doLogout() {
    try { await api('/api/logout', {}); } catch (e) { /* 忽略 */ }
    user = null;
    render();
    notify();
  }

  /* ----- 服务端自选列表 ----- */
  async function getWatchlist(market) {
    const d = await api('/api/watchlist?market=' + market);
    if (d.error) return null;
    if (d.codes === null || d.codes === undefined) return null; // 该账号还没存过
    return { codes: d.codes, groups: d.groups || {} };
  }
  async function saveWatchlist(market, codes, groups) {
    try { await api('/api/watchlist', { market, codes, groups: groups || {} }); }
    catch (e) { /* 下次保存会重试 */ }
  }

  async function init() {
    try {
      const d = await api('/api/me');
      user = d.user;
    } catch (e) { user = null; }
    render();
    notify();
  }

  init();
  return { get user() { return user; }, getWatchlist, saveWatchlist, rerender: render };
})();
