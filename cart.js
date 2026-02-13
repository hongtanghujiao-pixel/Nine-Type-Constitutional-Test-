// cart.js - 购物车功能

// 购物车数据结构
let cart = {
  items: [], // { id, name, type, price, quantity, image, description }
  total: 0
};

// 从 localStorage 加载购物车
function loadCart() {
  const saved = localStorage.getItem('jiuzhi_cart');
  if (saved) {
    cart = JSON.parse(saved);
  }
  updateCartCount();
}

// 保存购物车到 localStorage
function saveCart() {
  localStorage.setItem('jiuzhi_cart', JSON.stringify(cart));
  updateCartCount();
}

// 更新购物车数量显示
function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalItems > 0) {
    countEl.textContent = totalItems;
    countEl.classList.remove('hidden');
  } else {
    countEl.classList.add('hidden');
  }
}

// 添加商品到购物车
window.addToCart = function(product) {
  // 检查商品是否已存在
  const existingItem = cart.items.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.items.push({
      id: product.id,
      name: product.name,
      type: product.type, // 'gansu' 或 'common'
      price: product.price || 0,
      quantity: 1,
      image: product.image,
      description: product.description
    });
  }
  
  calculateTotal();
  saveCart();
  
  // 显示添加成功提示
  showToast(`已添加 ${product.name} 到购物车`);
}

// 从购物车移除商品
window.removeFromCart = function(productId) {
  cart.items = cart.items.filter(item => item.id !== productId);
  calculateTotal();
  saveCart();
  
  // 如果购物车弹窗打开，刷新显示
  const modal = document.querySelector('.cart-modal');
  if (modal) {
    showCartModal();
  }
}

// 更新商品数量
window.updateCartQuantity = function(productId, change) {
  const item = cart.items.find(item => item.id === productId);
  if (!item) return;
  
  item.quantity += change;
  
  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    calculateTotal();
    saveCart();
    
    // 如果购物车弹窗打开，刷新显示
    const modal = document.querySelector('.cart-modal');
    if (modal) {
      showCartModal();
    }
  }
}

// 计算总价
function calculateTotal() {
  cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// 清空购物车
window.clearCart = function() {
  if (confirm('确定要清空购物车吗？')) {
    cart.items = [];
    cart.total = 0;
    saveCart();
    
    const modal = document.querySelector('.cart-modal');
    if (modal) {
      showCartModal();
    }
  }
}

// 显示购物车弹窗
window.showCartModal = function() {
  // 移除旧弹窗
  const oldModal = document.querySelector('.cart-modal');
  if (oldModal) {
    oldModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.className = 'cart-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50';
  
  modal.innerHTML = `
    <div class="bg-paper rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="sticky top-0 bg-ochre/10 border-b border-ochre/20 p-6 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-ochre" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <h3 class="font-serif text-2xl text-ink">购物车</h3>
          <span class="text-sm text-indigo/70">(${cart.items.length} 种商品)</span>
        </div>
        <button type="button" class="close-modal w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600">✕</button>
      </div>
      
      <div class="p-6">
        ${cart.items.length === 0 ? `
          <div class="text-center py-16">
            <svg class="w-24 h-24 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p class="text-indigo/70 mb-4">购物车是空的</p>
            <button type="button" class="close-modal px-6 py-2 rounded-full bg-ochre text-white hover:bg-ochre/90 transition">继续选购</button>
          </div>
        ` : `
          <div class="space-y-4 mb-6">
            ${cart.items.map(item => `
              <div class="flex gap-4 p-4 bg-mist/60 rounded-xl border border-stone-200 hover:shadow-md transition">
                <div class="flex-shrink-0 w-20 h-20 bg-white rounded-lg overflow-hidden">
                  <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'">
                </div>
                <div class="flex-1">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h4 class="font-medium text-ink">${item.name}</h4>
                      ${item.type === 'gansu' ? '<span class="text-xs px-2 py-0.5 rounded-full bg-ochre/15 text-ochre">甘肃特产</span>' : ''}
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="text-stone-400 hover:text-red-500 transition">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-indigo/70 mb-3">${item.description}</p>
                  <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                      <button onclick="updateCartQuantity('${item.id}', -1)" class="w-6 h-6 rounded-full border border-stone-300 hover:border-ochre hover:text-ochre transition flex items-center justify-center">-</button>
                      <span class="text-sm font-medium w-8 text-center">${item.quantity}</span>
                      <button onclick="updateCartQuantity('${item.id}', 1)" class="w-6 h-6 rounded-full border border-stone-300 hover:border-ochre hover:text-ochre transition flex items-center justify-center">+</button>
                    </div>
                    <div class="text-right">
                      <p class="text-sm text-ochre font-medium">¥${(item.price * item.quantity).toFixed(2)}</p>
                      <p class="text-xs text-indigo/50">¥${item.price.toFixed(2)} × ${item.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="border-t border-stone-200 pt-4 mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-indigo/80">商品总计</span>
              <span class="text-ink">¥${cart.total.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-indigo/80">运费</span>
              <span class="text-green-600 text-sm">免运费</span>
            </div>
            <div class="flex justify-between items-center text-lg font-medium pt-2 border-t border-stone-200">
              <span class="text-ink">合计</span>
              <span class="text-ochre">¥${cart.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="flex gap-3">
            <button onclick="clearCart()" class="flex-1 px-6 py-3 rounded-full border-2 border-stone-300 text-indigo hover:bg-mist transition">清空购物车</button>
            <button onclick="checkout()" class="flex-1 px-6 py-3 rounded-full bg-ochre text-white hover:bg-ochre/90 transition shadow-lg">去结算</button>
          </div>
        `}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 绑定关闭事件
  modal.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.remove();
    });
  });
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// 结算
window.checkout = function() {
  alert('结算功能开发中...\n\n您的购物车商品：\n' + 
    cart.items.map(item => `${item.name} × ${item.quantity}`).join('\n') +
    `\n\n总计：¥${cart.total.toFixed(2)}`
  );
}

// 显示提示消息
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed top-20 right-4 z-50 px-6 py-3 bg-ochre text-white rounded-lg shadow-lg animate-fade-in';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 页面加载时初始化购物车
window.addEventListener('load', loadCart);

