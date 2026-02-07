/**
 * 用户认证系统 - 注册、登录、用户管理
 * 使用 localStorage 存储用户数据
 */

(function() {
  'use strict';

  // ========== 工具函数 ==========
  
  /**
   * 获取所有用户数据
   */
  function getAllUsers() {
    const usersData = localStorage.getItem('jiuzhi_users');
    return usersData ? JSON.parse(usersData) : [];
  }

  /**
   * 保存所有用户数据
   */
  function saveAllUsers(users) {
    localStorage.setItem('jiuzhi_users', JSON.stringify(users));
  }

  /**
   * 获取当前登录用户
   */
  function getCurrentUser() {
    const userData = localStorage.getItem('jiuzhi_current_user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * 设置当前登录用户
   */
  function setCurrentUser(user) {
    localStorage.setItem('jiuzhi_current_user', JSON.stringify(user));
  }

  /**
   * 用户登出
   */
  function logout() {
    localStorage.removeItem('jiuzhi_current_user');
  }

  /**
   * 检查用户名是否已存在
   */
  function isUsernameExists(username) {
    const users = getAllUsers();
    return users.some(user => user.username === username);
  }



  /**
   * 简单的密码加密（实际项目中应使用更安全的方法）
   */
  function hashPassword(password) {
    // 这里使用简单的 Base64 编码，实际项目应使用 bcrypt 等
    return btoa(password);
  }

  /**
   * 密码解密
   */
  function unhashPassword(hashedPassword) {
    return atob(hashedPassword);
  }

  /**
   * 显示错误信息
   */
  function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
      errorElement.classList.add('error-message');
    }
  }

  /**
   * 隐藏错误信息
   */
  function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.classList.add('hidden');
    }
  }

  /**
   * 清除所有错误信息
   */
  function clearAllErrors() {
    const errorElements = document.querySelectorAll('[id$="Error"]');
    errorElements.forEach(el => el.classList.add('hidden'));
  }

  // ========== 注册功能 ==========
  
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    // 实时验证
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (usernameInput) {
      usernameInput.addEventListener('blur', function() {
        const username = this.value.trim();
        if (!username) {
          showError('usernameError', '用户名不能为空');
        } else if (username.length < 3 || username.length > 20) {
          showError('usernameError', '用户名长度应为3-20个字符');
        } else if (isUsernameExists(username)) {
          showError('usernameError', '该用户名已被注册');
        } else {
          hideError('usernameError');
        }
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('blur', function() {
        const password = this.value;
        if (!password) {
          showError('passwordError', '密码不能为空');
        } else if (password.length < 6) {
          showError('passwordError', '密码长度至少为6个字符');
        } else {
          hideError('passwordError');
        }
      });
    }

    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('blur', function() {
        const password = passwordInput.value;
        const confirmPassword = this.value;
        if (!confirmPassword) {
          showError('confirmPasswordError', '请确认密码');
        } else if (password !== confirmPassword) {
          showError('confirmPasswordError', '两次输入的密码不一致');
        } else {
          hideError('confirmPasswordError');
        }
      });
    }

    // 表单提交
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      clearAllErrors();

      // 获取表单数据
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      let hasError = false;

      // 验证用户名
      if (!username) {
        showError('usernameError', '用户名不能为空');
        hasError = true;
      } else if (username.length < 3 || username.length > 20) {
        showError('usernameError', '用户名长度应为3-20个字符');
        hasError = true;
      } else if (isUsernameExists(username)) {
        showError('usernameError', '该用户名已被注册');
        hasError = true;
      }

      // 验证密码
      if (!password) {
        showError('passwordError', '密码不能为空');
        hasError = true;
      } else if (password.length < 6) {
        showError('passwordError', '密码长度至少为6个字符');
        hasError = true;
      }

      // 验证确认密码
      if (!confirmPassword) {
        showError('confirmPasswordError', '请确认密码');
        hasError = true;
      } else if (password !== confirmPassword) {
        showError('confirmPasswordError', '两次输入的密码不一致');
        hasError = true;
      }

      if (hasError) {
        return;
      }

      // 创建新用户
      const newUser = {
        id: Date.now().toString(),
        username: username,
        password: hashPassword(password),
        createdAt: new Date().toISOString(),
        testResults: [] // 存储体质测试结果
      };

      // 保存用户
      const users = getAllUsers();
      users.push(newUser);
      saveAllUsers(users);

      // 自动登录
      const userInfo = {
        id: newUser.id,
        username: newUser.username,
        loginTime: new Date().toISOString()
      };
      setCurrentUser(userInfo);

      // 显示成功提示，然后跳转到个人档案
      const successModal = document.getElementById('successModal');
      if (successModal) {
        successModal.classList.remove('hidden');
        // 2秒后自动跳转到个人档案页面
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 2000);
      }
    });
  }

  // ========== 登录功能 ==========
  
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const loginId = document.getElementById('loginId').value.trim();
      const loginPassword = document.getElementById('loginPassword').value;
      const remember = document.querySelector('input[name="remember"]').checked;

      if (!loginId || !loginPassword) {
        showError('loginError', '请输入用户名和密码');
        return;
      }

      // 查找用户
      const users = getAllUsers();
      const user = users.find(u => 
        u.username === loginId && 
        unhashPassword(u.password) === loginPassword
      );

      if (!user) {
        showError('loginError', '用户名或密码错误');
        return;
      }

      // 登录成功
      const userInfo = {
        id: user.id,
        username: user.username,
        loginTime: new Date().toISOString()
      };

      setCurrentUser(userInfo);

      // 如果选择记住我，设置更长的过期时间（这里简化处理）
      if (remember) {
        localStorage.setItem('jiuzhi_remember', 'true');
      }

      // 跳转到首页
      window.location.href = 'index.html';
    });
  }

  // ========== 首页用户状态显示 ==========
  
  // 检查是否在首页
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '/d:/网站/') {
    const currentUser = getCurrentUser();
    
    // 更新导航栏用户状态
    const navUserArea = document.querySelector('header .flex.items-center.gap-3');
    if (navUserArea && currentUser) {
      navUserArea.innerHTML = `
        <div class="relative">
          <button id="userMenuBtn" class="flex items-center gap-2 text-sm text-indigo hover:text-ochre transition">
            <span class="w-8 h-8 rounded-full bg-ochre/20 flex items-center justify-center text-ochre font-medium">
              ${currentUser.username.charAt(0).toUpperCase()}
            </span>
            <span>${currentUser.username}</span>
          </button>
          <div id="userMenuDropdown" class="hidden absolute right-0 top-full mt-2 w-48 bg-paper border border-stone-200 rounded-xl shadow-lg py-2 z-50">
            <a href="profile.html" class="block px-4 py-2 text-sm text-indigo hover:bg-mist transition">我的档案</a>
            <a href="profile.html#testRecords" class="block px-4 py-2 text-sm text-indigo hover:bg-mist transition">测试记录</a>
            <a href="profile.html#settings" class="block px-4 py-2 text-sm text-indigo hover:bg-mist transition">账号设置</a>
            <hr class="my-2 border-stone-200" />
            <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-red-500 hover:bg-mist transition">退出登录</a>
          </div>
        </div>
      `;

      // 绑定点击事件显示/隐藏菜单
      const userMenuBtn = document.getElementById('userMenuBtn');
      const userMenuDropdown = document.getElementById('userMenuDropdown');
      
      if (userMenuBtn && userMenuDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          userMenuDropdown.classList.toggle('hidden');
        });

        // 点击页面其他地方关闭菜单
        document.addEventListener('click', function(e) {
          if (!userMenuDropdown.contains(e.target) && e.target !== userMenuBtn) {
            userMenuDropdown.classList.add('hidden');
          }
        });
      }

      // 绑定退出登录事件
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (confirm('确定要退出登录吗？')) {
            logout();
            window.location.reload();
          }
        });
      }
    }
  }

  // ========== 导出到全局（供其他脚本使用） ==========
  
  window.JiuzhiAuth = {
    getCurrentUser: getCurrentUser,
    logout: logout,
    isLoggedIn: function() {
      return getCurrentUser() !== null;
    },
    saveTestResult: function(result) {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('请先登录');
        window.location.href = 'login.html';
        return false;
      }

      // 获取完整用户数据
      const users = getAllUsers();
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex !== -1) {
        // 添加测试结果
        if (!users[userIndex].testResults) {
          users[userIndex].testResults = [];
        }
        users[userIndex].testResults.push({
          ...result,
          timestamp: new Date().toISOString()
        });
        
        // 保存
        saveAllUsers(users);
        return true;
      }
      return false;
    }
  };

})();

