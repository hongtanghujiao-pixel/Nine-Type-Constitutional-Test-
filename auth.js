// auth.js - Supabase 云端版

// --- 1. 初始化 Supabase ---
const supabaseUrl = 'https://yospqbbeykizesujlhiq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvc3BxYmJleWtpemVzdWpsaGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTY1MTcsImV4cCI6MjA4NjU3MjUxN30.gE1rm3hpyV-_NVIPCch0hYG29OyxBGY2jzshVizPAZc'

// 检查 Supabase 库是否加载
if (typeof supabase === 'undefined') {
    console.error('Supabase 库未加载！请检查 index.html 中的 script 标签')
}

const { createClient } = supabase
const supabaseClient = createClient(supabaseUrl, supabaseKey)

console.log('Supabase 客户端已初始化')

// --- 2. 界面控制逻辑 ---
// 检查登录状态并切换显示（右上角）
async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser()
    const loginForm = document.getElementById('header-login-form')
    const userPanel = document.getElementById('header-user-panel')
    
    // 防止页面还没加载完找不到元素报错
    if (!loginForm || !userPanel) return;

    if (user) {
        loginForm.classList.add('hidden')
        userPanel.classList.remove('hidden')
        // 更新显示的邮箱
        const emailSpan = document.getElementById('header-user-email')
        if(emailSpan) emailSpan.innerText = user.email
    } else {
        loginForm.classList.remove('hidden')
        userPanel.classList.add('hidden')
    }
}

// 页面加载完成后，立刻检查一次状态
window.addEventListener('load', checkUser);

// --- 3. 按钮功能 ---

// 右上角注册
window.handleHeaderSignUp = async function() {
    const email = document.getElementById('header-email').value
    const password = document.getElementById('header-password').value
    const msg = document.getElementById('header-auth-msg')
    
    if(!email || !password) { 
        if(msg) msg.innerText = "请填写完整"; 
        setTimeout(() => { if(msg) msg.innerText = "" }, 3000)
        return; 
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        if(msg) msg.innerText = "请输入有效的邮箱地址"
        setTimeout(() => { if(msg) msg.innerText = "" }, 3000)
        return
    }
    
    // 验证密码长度
    if (password.length < 6) {
        if(msg) msg.innerText = "密码至少需要6个字符"
        setTimeout(() => { if(msg) msg.innerText = "" }, 3000)
        return
    }
    
    if(msg) msg.innerText = "注册中..."
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({ 
            email, 
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        })
        
        if (error) {
            console.error('注册错误:', error)
            if(msg) msg.innerText = "注册失败: " + error.message
            setTimeout(() => { if(msg) msg.innerText = "" }, 5000)
        } else {
            console.log('注册成功:', data)
            alert("注册成功！请查收验证邮件（可能在垃圾箱）。")
            if(msg) msg.innerText = ""
            // 清空输入框
            document.getElementById('header-email').value = ''
            document.getElementById('header-password').value = ''
        }
    } catch (err) {
        console.error('注册异常:', err)
        if(msg) msg.innerText = "注册失败: " + err.message
        setTimeout(() => { if(msg) msg.innerText = "" }, 5000)
    }
}

// 右上角登录
window.handleHeaderSignIn = async function() {
    const email = document.getElementById('header-email').value
    const password = document.getElementById('header-password').value
    const msg = document.getElementById('header-auth-msg')
    
    if(!email || !password) { 
        if(msg) msg.innerText = "请填写完整"; 
        setTimeout(() => { if(msg) msg.innerText = "" }, 3000)
        return; 
    }
    
    if(msg) msg.innerText = "登录中..."
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
        
        if (error) {
            console.error('登录错误:', error)
            if(msg) msg.innerText = "登录失败: " + error.message
            setTimeout(() => { if(msg) msg.innerText = "" }, 5000)
        } else {
            console.log('登录成功:', data)
            if(msg) msg.innerText = ""
            checkUser() // 刷新界面状态
            // 清空输入框
            document.getElementById('header-email').value = ''
            document.getElementById('header-password').value = ''
        }
    } catch (err) {
        console.error('登录异常:', err)
        if(msg) msg.innerText = "登录失败: " + err.message
        setTimeout(() => { if(msg) msg.innerText = "" }, 5000)
    }
}

// 注册（保留兼容性）
window.handleSignUp = window.handleHeaderSignUp

// 登录（保留兼容性）
window.handleSignIn = window.handleHeaderSignIn

// 退出
window.handleSignOut = async function() {
    await supabaseClient.auth.signOut()
    checkUser() // 刷新界面
}

// 显示历史记录弹窗
window.showHistoryModal = async function() {
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
        alert('请先登录查看测试记录')
        return
    }
    
    const { data, error } = await supabaseClient
        .from('user_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('获取历史记录失败:', error)
        alert('获取历史记录失败，请稍后重试')
        return
    }

    // 创建弹窗
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'
    modal.innerHTML = `
      <div class="bg-paper rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-ochre/10 border-b border-ochre/20 p-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📋</span>
            <h3 class="font-serif text-2xl text-ink">我的测试记录</h3>
            <span class="text-sm text-indigo/70">(${data ? data.length : 0} 条记录)</span>
          </div>
          <button type="button" class="close-modal w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600">✕</button>
        </div>
        <div class="p-6">
          ${!data || data.length === 0 ? 
            `<div class="text-center py-16">
              <svg class="w-24 h-24 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p class="text-indigo/70 mb-4">暂无测试记录</p>
              <p class="text-sm text-indigo/50">完成体质测试后，记录会自动保存在这里</p>
            </div>` :
            `<div class="space-y-4">
              ${data.map((record, index) => {
                const date = new Date(record.created_at).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
                
                // 调理程度标签
                const levelBadge = record.adjustment_level ? {
                  'mild': '<span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">轻度调理</span>',
                  'moderate': '<span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">中度调理</span>',
                  'severe': '<span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">重度调理</span>'
                }[record.adjustment_level] || '' : ''
                
                return `
                  <div class="p-5 bg-mist/60 rounded-xl border border-stone-200 hover:shadow-lg hover:border-ochre/40 transition cursor-pointer record-item" data-record-index="${index}">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex items-center gap-3">
                        <h4 class="font-serif text-xl text-ochre">${record.main_type}</h4>
                        ${levelBadge}
                      </div>
                      <span class="text-xs text-indigo/70">${date}</span>
                    </div>
                    ${record.details && record.details.description ? 
                      `<p class="text-sm text-indigo/80 mb-3 line-clamp-2">${record.details.description}</p>` : ''}
                    ${record.details && record.details.secondaryConstitutions && record.details.secondaryConstitutions.length > 0 ?
                      `<p class="text-xs text-indigo/70 mb-2">兼夹倾向：${record.details.secondaryConstitutions.join('、')}</p>` : ''}
                    ${record.scores ? 
                      `<div class="flex gap-2 flex-wrap mt-3">
                        ${Object.entries(record.scores).slice(0, 3).map(([key, value]) => 
                          `<span class="text-xs px-2 py-1 rounded bg-stone-200/60 text-stone-700">${key}: ${value}分</span>`
                        ).join('')}
                      </div>` : ''}
                    <div class="mt-3 text-right">
                      <span class="text-xs text-ochre hover:underline">点击查看详情 →</span>
                    </div>
                  </div>
                `
              }).join('')}
            </div>`
          }
        </div>
        <div class="sticky bottom-0 bg-paper border-t border-stone-200 p-4">
          <button type="button" class="close-modal w-full px-6 py-3 rounded-full border-2 border-stone-300 text-indigo hover:bg-mist transition">关闭</button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // 绑定记录点击事件
    modal.querySelectorAll('.record-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        modal.remove()
        showRecordDetail(data[index])
      })
    })
    
    // 绑定关闭事件
    modal.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.remove()
      })
    })
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
}

// 显示记录详情
window.showRecordDetail = function(record) {
    const date = new Date(record.created_at).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    
    // 调理程度配置
    const levelConfig = {
      'mild': {
        label: '轻度调理',
        color: 'bg-green-50 border-green-200 text-green-800',
        badgeColor: 'bg-green-100 text-green-700'
      },
      'moderate': {
        label: '中度调理',
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        badgeColor: 'bg-yellow-100 text-yellow-700'
      },
      'severe': {
        label: '重度调理',
        color: 'bg-red-50 border-red-200 text-red-800',
        badgeColor: 'bg-red-100 text-red-700'
      }
    }
    
    const level = levelConfig[record.adjustment_level] || null
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'
    modal.innerHTML = `
      <div class="bg-paper rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-ochre/10 border-b border-ochre/20 p-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📊</span>
            <div>
              <h3 class="font-serif text-2xl text-ink">${record.main_type}</h3>
              <p class="text-xs text-indigo/70 mt-1">测试时间：${date}</p>
            </div>
            ${level ? `<span class="text-xs px-3 py-1 rounded-full ${level.badgeColor} font-medium">${level.label}</span>` : ''}
          </div>
          <button type="button" class="close-modal w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600">✕</button>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- 体质描述 -->
          ${record.details && record.details.description ? `
          <div class="card bg-mist/60 rounded-xl p-5 border border-stone-200">
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">📝</span> 体质描述
            </h4>
            <p class="text-indigo/90">${record.details.description}</p>
          </div>
          ` : ''}
          
          <!-- 兼夹体质 -->
          ${record.details && record.details.secondaryConstitutions && record.details.secondaryConstitutions.length > 0 ? `
          <div class="card bg-mist/60 rounded-xl p-5 border border-stone-200">
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">🔄</span> 兼夹倾向
            </h4>
            <div class="flex flex-wrap gap-2">
              ${record.details.secondaryConstitutions.map(c => 
                `<span class="px-3 py-1 rounded-full bg-ochre/15 text-ochre text-sm">${c}</span>`
              ).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- 调理程度 -->
          ${level ? `
          <div class="card ${level.color} border-2 rounded-xl p-5">
            <h4 class="font-medium mb-3 flex items-center gap-2">
              <span class="text-2xl">⚕️</span> 调理建议
            </h4>
            <p class="mb-2"><strong>调理程度：</strong>${level.label}</p>
            ${record.adjustment_level === 'mild' ? 
              '<p>建议通过日常茶饮调理，配合规律作息和适度运动。</p>' : 
              record.adjustment_level === 'moderate' ? 
              '<p>建议采用产品组合进行系统调理，坚持3-6个月可见明显改善。</p>' :
              '<p>建议线下或线上就医，由专业中医师制定个性化调理方案。</p>'
            }
          </div>
          ` : ''}
          
          <!-- 体质得分 -->
          ${record.scores ? `
          <div class="card bg-mist/60 rounded-xl p-5 border border-stone-200">
            <h4 class="font-medium text-ink mb-4 flex items-center gap-2">
              <span class="text-ochre">📈</span> 体质得分详情
            </h4>
            <div class="grid grid-cols-3 gap-3">
              ${Object.entries(record.scores).map(([key, value]) => {
                // 将拼音ID转换为中文名称
                const nameMap = {
                  'pinghe': '平和质',
                  'qixu': '气虚质',
                  'yangxu': '阳虚质',
                  'yinxu': '阴虚质',
                  'tanshi': '痰湿质',
                  'shire': '湿热质',
                  'xueyu': '血瘀质',
                  'qiyu': '气郁质',
                  'tebing': '特禀质'
                };
                const displayName = nameMap[key] || key;
                return `
                <div class="p-3 bg-paper rounded-lg border border-stone-200/60 text-center">
                  <p class="text-xs text-indigo/70 mb-1">${displayName}</p>
                  <p class="text-2xl font-serif text-ochre">${value}</p>
                  <p class="text-xs text-indigo/60">分</p>
                </div>
              `}).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- 特征表现 -->
          ${record.details && record.details.features ? `
          <div class="card bg-mist/60 rounded-xl p-5 border border-stone-200">
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">🔍</span> 特征表现
            </h4>
            <p class="text-indigo/90">${record.details.features}</p>
          </div>
          ` : ''}
          
          <!-- 形成原因 -->
          ${record.details && record.details.cause ? `
          <div class="card bg-mist/60 rounded-xl p-5 border border-stone-200">
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">💡</span> 形成原因
            </h4>
            <p class="text-indigo/90">${record.details.cause}</p>
          </div>
          ` : ''}
          
          <!-- 易患疾病 -->
          ${record.details && record.details.risks ? `
          <div class="card bg-mist/60 rounded-xl p-5 border border-stone-200">
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">⚠️</span> 易患疾病
            </h4>
            <p class="text-indigo/90">${record.details.risks}</p>
          </div>
          ` : ''}
          
          <!-- 饮食建议 -->
          ${record.details && record.details.dietRecommend ? `
          <div class="card bg-mist/60 rounded-xl p-5 border border-stone-200">
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">🍽️</span> 饮食建议
            </h4>
            <p class="text-indigo/90">${record.details.dietRecommend}</p>
          </div>
          ` : ''}
          
          <!-- 调理原则 -->
          ${record.details && record.details.principle ? `
          <div class="card bg-ochre/5 rounded-xl p-5 border border-ochre/20">
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">🌿</span> 调理原则
            </h4>
            <p class="text-indigo/90">${record.details.principle}</p>
          </div>
          ` : ''}
          
          <!-- 推荐食材 -->
          ${record.details && record.details.foods ? `
          <div class="card bg-ochre/5 rounded-xl p-5 border border-ochre/20">
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">🥗</span> 推荐食材
            </h4>
            <p class="text-indigo/90">${record.details.foods}</p>
          </div>
          ` : ''}
        </div>
        
        <div class="sticky bottom-0 bg-paper border-t border-stone-200 p-4 flex gap-3">
          <button type="button" class="back-to-list flex-1 px-6 py-3 rounded-full border-2 border-ochre text-ochre hover:bg-ochre/10 transition">← 返回列表</button>
          <button type="button" class="close-modal px-6 py-3 rounded-full bg-ochre text-white hover:bg-ochre/90 transition">关闭</button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // 返回列表按钮
    modal.querySelector('.back-to-list').addEventListener('click', () => {
      modal.remove()
      window.showHistoryModal()
    })
    
    // 绑定关闭事件
    modal.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.remove()
      })
    })
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
}

// 读取历史记录（保留兼容性）
window.loadHistory = window.showHistoryModal

// --- 4. 给 app.js 用的保存接口 ---
window.saveUserResult = async function(testResult) {
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    // 只有登录了才保存
    if (!user) {
        console.log("用户未登录，测试结果仅本地展示")
        return false
    }
    
    try {
        const { data, error } = await supabaseClient.from('user_records').insert({
            user_id: user.id,
            main_type: testResult.constitution,
            constitution_id: testResult.constitutionId,
            scores: testResult.scores,
            adjustment_level: testResult.adjustmentLevel,
            details: {
                description: testResult.description,
                secondaryConstitutions: testResult.secondaryConstitutions,
                dietRecommend: testResult.dietRecommend,
                features: testResult.features,
                cause: testResult.cause,
                risks: testResult.risks,
                principle: testResult.principle,
                foods: testResult.foods
            }
        })
        
        if (error) {
            console.error("保存测试结果失败:", error)
            return false
        }
        
        console.log("✅ 测试结果已自动同步到云端")
        return true
    } catch (err) {
        console.error("保存测试结果异常:", err)
        return false
    }
}
