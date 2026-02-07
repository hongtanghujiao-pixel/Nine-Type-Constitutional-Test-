/**
 * 体质测试单页应用：轮播、分步答题、计分、结果与产品推荐
 */
(function () {
  const QUESTIONS = window.QUESTIONS;
  const DATA = window.CONSTITUTION_DATA;
  const QUESTIONS_PER_STEP = 3;
  const TOTAL = QUESTIONS.length;

  // ---------- 轮播 ----------
  const slidesWrapper = document.querySelector('.hero-slides-wrapper');
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  let currentSlide = 0;
  let carouselTimer = null;

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    if (slidesWrapper) {
      slidesWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    dots.forEach((d, i) => {
      d.classList.toggle('bg-ochre', i === currentSlide);
      d.classList.toggle('bg-stone-300', i !== currentSlide);
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function startCarousel() {
    stopCarousel();
    carouselTimer = setInterval(nextSlide, 5000);
  }

  function stopCarousel() {
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = null;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      showSlide(i);
      startCarousel();
    });
  });

  if (slides.length) {
    startCarousel();
  }

  // ---------- 测试流程 ----------
  const testIntro = document.getElementById('testIntro');
  const testFlow = document.getElementById('testFlow');
  const testCalculating = document.getElementById('testCalculating');
  const testResult = document.getElementById('testResult');
  const totalQuestionsEl = document.getElementById('totalQuestions');
  const progressText = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');
  const questionCards = document.getElementById('questionCards');
  const btnBeginTest = document.getElementById('btnBeginTest');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');

  let answers = {}; // id -> 0..4
  let currentStep = 0;
  const totalSteps = Math.ceil(TOTAL / QUESTIONS_PER_STEP);

  totalQuestionsEl.textContent = TOTAL;

  function getQuestionsForStep(step) {
    const start = step * QUESTIONS_PER_STEP;
    return QUESTIONS.slice(start, start + QUESTIONS_PER_STEP);
  }

  function renderStep(step) {
    const qs = getQuestionsForStep(step);
    questionCards.innerHTML = qs
      .map(
        (q) => `
      <div class="card-question bg-paper rounded-2xl p-6 border border-stone-200/60 shadow-sm">
        <p class="font-medium text-ink mb-4">${q.text}</p>
        <div class="flex flex-wrap gap-2">
          ${q.options
            .map(
              (opt, i) => `
            <button type="button" class="option-btn px-4 py-2 rounded-full border-2 text-sm ${answers[q.id] === i ? 'selected border-ochre bg-ochre/10' : 'border-stone-200 bg-mist/40'}" data-qid="${q.id}" data-opt="${i}">
              ${opt}
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `
      )
      .join('');

    questionCards.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const qid = parseInt(this.dataset.qid, 10);
        const opt = parseInt(this.dataset.opt, 10);
        answers[qid] = opt;
        const card = this.closest('.card-question');
        card.querySelectorAll('.option-btn').forEach((b) => {
          b.classList.remove('selected', 'border-ochre', 'bg-ochre/10');
          b.classList.add('border-stone-200', 'bg-mist/40');
        });
        this.classList.add('selected', 'border-ochre', 'bg-ochre/10');
        this.classList.remove('border-stone-200', 'bg-mist/40');
        updateNextButton();
      });
    });

    const start = step * QUESTIONS_PER_STEP + 1;
    const end = Math.min((step + 1) * QUESTIONS_PER_STEP, TOTAL);
    progressText.textContent = `${end} / ${TOTAL}`;
    progressBar.style.width = `${(end / TOTAL) * 100}%`;
    btnPrev.classList.toggle('hidden', step === 0);
    btnNext.textContent = step === totalSteps - 1 ? '提交并查看结果' : '下一组';
    updateNextButton();
  }

  function updateNextButton() {
    const qs = getQuestionsForStep(currentStep);
    const allAnswered = qs.every((q) => answers[q.id] !== undefined);
    btnNext.disabled = !allAnswered;
  }

  function showSection(show) {
    testIntro.classList.add('hidden');
    testFlow.classList.add('hidden');
    testCalculating.classList.add('hidden');
    testResult.classList.add('hidden');
    if (show === 'intro') testIntro.classList.remove('hidden');
    else if (show === 'flow') testFlow.classList.remove('hidden');
    else if (show === 'calculating') testCalculating.classList.remove('hidden');
    else if (show === 'result') testResult.classList.remove('hidden');
  }

  btnBeginTest.addEventListener('click', () => {
    answers = {};
    currentStep = 0;
    showSection('flow');
    renderStep(0);
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      renderStep(currentStep);
    }
  });

  btnNext.addEventListener('click', () => {
    if (currentStep < totalSteps - 1) {
      currentStep++;
      renderStep(currentStep);
    } else {
      showSection('calculating');
      setTimeout(() => {
        computeAndShowResult();
      }, 2200);
    }
  });

  // ---------- 计分与结果（《中医体质分类与判定》标准）----------
  const constitutionIds = [
    'pinghe', 'qixu', 'yangxu', 'yinxu', 'tanshi', 'shire', 'xueyu', 'qiyu', 'tebing',
  ];

  /** 原始分 = 各条目分值之和；逆向计分条目：1→5, 2→4, 3→3, 4→2, 5→1 */
  function getItemScore(q, answerIndex) {
    if (answerIndex === undefined) return 0;
    const raw = answerIndex + 1; // 1-5
    return q.reverse ? 6 - raw : raw;
  }

  /** 转化分 = [(原始分 - 条目数) / (条目数×4)] × 100，结果 0-100 */
  function computeScores() {
    const rawSums = {};
    const counts = {};
    constitutionIds.forEach((id) => {
      rawSums[id] = 0;
      counts[id] = 0;
    });
    QUESTIONS.forEach((q) => {
      const score = getItemScore(q, answers[q.id]);
      rawSums[q.constitution] += score;
      counts[q.constitution]++;
    });
    const transform = {};
    constitutionIds.forEach((id) => {
      const n = counts[id];
      if (!n) {
        transform[id] = 0;
        return;
      }
      const raw = rawSums[id];
      transform[id] = Math.round(((raw - n) / (n * 4)) * 100);
      transform[id] = Math.max(0, Math.min(100, transform[id]));
    });
    return transform;
  }

  /** 平和质：转化分≥60 且 其他8种均<40 → 平和质；否则主质为转化分最高的偏颇体质 */
  function getMainConstitution(scores) {
    const others = constitutionIds.filter((id) => id !== 'pinghe');
    const allOthersLow = others.every((id) => scores[id] < 40);
    if (scores.pinghe >= 60 && allOthersLow) return 'pinghe';
    let maxId = others[0];
    let maxScore = scores[maxId];
    others.forEach((id) => {
      if (scores[id] > maxScore) {
        maxScore = scores[id];
        maxId = id;
      }
    });
    return maxId;
  }

  /** 兼夹体质：转化分 30–39 的偏颇体质（倾向是） */
  function getSecondaryConstitutions(scores, mainId) {
    const others = constitutionIds.filter((id) => id !== 'pinghe' && id !== mainId);
    return others.filter((id) => scores[id] >= 30 && scores[id] < 40);
  }

  let radarChartInstance = null;

  function computeAndShowResult() {
    const scores = computeScores();
    const mainId = getMainConstitution(scores);
    const main = DATA[mainId];
    const secondaryIds = getSecondaryConstitutions(scores, mainId);

    document.getElementById('resultTitle').textContent = main.name;
    document.getElementById('resultDesc').textContent = main.desc;
    const dietEl = document.getElementById('resultDietRecommend');
    if (dietEl && main.dietRecommend) dietEl.textContent = main.dietRecommend;
    document.getElementById('resultFeatures').textContent = main.features;
    document.getElementById('resultCause').textContent = main.cause;
    document.getElementById('resultRisks').textContent = main.risks;

    const secondaryEl = document.getElementById('resultSecondary');
    if (secondaryEl) {
      if (secondaryIds.length) {
        secondaryEl.classList.remove('hidden');
        secondaryEl.querySelector('.result-secondary-list').textContent = secondaryIds
          .map((id) => DATA[id].name)
          .join('、');
      } else {
        secondaryEl.classList.add('hidden');
      }
    }

    const labels = constitutionIds.map((id) => DATA[id].name);
    const values = constitutionIds.map((id) => scores[id] ?? 0);

    const canvas = document.getElementById('radarChart');
    const ctx = canvas.getContext('2d');
    if (radarChartInstance) radarChartInstance.destroy();
    radarChartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: '体质得分',
            data: values,
            backgroundColor: 'rgba(166, 124, 82, 0.2)',
            borderColor: 'rgb(166, 124, 82)',
            borderWidth: 2,
            pointBackgroundColor: 'rgb(166, 124, 82)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(166, 124, 82)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25 },
            pointLabels: { font: { size: 11 } },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });

    // 保存测试结果到用户数据
    if (window.JiuzhiAuth && window.JiuzhiAuth.isLoggedIn()) {
      const testResult = {
        timestamp: new Date().toISOString(),
        constitution: main.name,
        constitutionId: mainId,
        description: main.desc,
        scores: scores,
        secondaryConstitutions: secondaryIds.map(id => DATA[id].name),
        dietRecommend: main.dietRecommend,
        features: main.features,
        cause: main.cause,
        risks: main.risks,
        principle: main.principle,
        foods: main.foods,
        products: main.products,
        recipe: main.recipe
      };
      
      window.JiuzhiAuth.saveTestResult(testResult);
    }

    showSection('result');
    renderProducts(mainId);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- 产品推荐 ----------
  function renderProducts(constitutionId) {
    const main = DATA[constitutionId];
    if (!main) return;
    document.getElementById('productsTitle').textContent = `【${main.name}】的专属食疗方案`;
    document.getElementById('principleText').textContent = main.principle;
    document.getElementById('foodsText').textContent = main.foods;
    const grid = document.getElementById('productGrid');
    
    // 图片映射表 - 将产品名称映射到图片URL
    const getProductImage = (productName) => {
      const imageMap = {
        // 平和质
        '陇西黄芪': 'https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=400&h=400&fit=crop', // 黄芪根
        '静宁苹果': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop', // 红苹果
        '庆阳小米': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', // 小米谷物
        
        // 气虚质
        '定西马铃薯': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=400&fit=crop', // 马铃薯
        '临泽红枣': 'https://images.unsplash.com/photo-1607965342474-e173c0c6d9b8?w=400&h=400&fit=crop', // 红枣
        
        // 阳虚质
        '天水生姜': 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&h=400&fit=crop', // 生姜
        '民勤枸杞': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop', // 枸杞
        '陇南土鸡': 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=400&fit=crop', // 鸡
        '陇南核桃': 'https://images.unsplash.com/photo-1622484211850-2e0e5a5e8c1e?w=400&h=400&fit=crop', // 核桃
        
        // 阴虚质
        '陇南银耳': 'https://images.unsplash.com/photo-1617343267882-2f8e5e3e3c3e?w=400&h=400&fit=crop', // 银耳
        '兰州百合': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=400&fit=crop', // 百合
        '天水秋梨': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop', // 梨
        '陇南黑芝麻': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=400&fit=crop', // 黑芝麻
        
        // 痰湿质
        '定西薏苡仁': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', // 薏米
        '陇南赤小豆': 'https://images.unsplash.com/photo-1583852707983-fe5bee5e7e9e?w=400&h=400&fit=crop', // 红豆
        '陇南花椒': 'https://images.unsplash.com/photo-1599909533730-f9d7e4f2e3e3?w=400&h=400&fit=crop', // 花椒
        '兰州冬瓜': 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=400&h=400&fit=crop', // 冬瓜
        
        // 湿热质
        '定西绿豆': 'https://images.unsplash.com/photo-1583852707983-fe5bee5e7e9e?w=400&h=400&fit=crop', // 绿豆
        '兰州苦瓜': 'https://images.unsplash.com/photo-1597305877032-0668b3c6413a?w=400&h=400&fit=crop', // 苦瓜
        '陇南绿茶': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop', // 绿茶
        
        // 血瘀质
        '天水山楂': 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&h=400&fit=crop', // 山楂
        '陇南黑木耳': 'https://images.unsplash.com/photo-1617343267882-2f8e5e3e3c3e?w=400&h=400&fit=crop', // 黑木耳
        '苦水玫瑰': 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&h=400&fit=crop', // 玫瑰花
        '陇南红糖': 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&h=400&fit=crop', // 红糖
        
        // 气郁质
        '永登苦水玫瑰': 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&h=400&fit=crop', // 玫瑰花
        '苦水玫瑰茶': 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&h=400&fit=crop', // 玫瑰花茶
        '陇南薄荷': 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&h=400&fit=crop', // 薄荷
        '庆阳浮小麦': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop', // 小麦
        
        // 特禀质
        '陇南土蜂蜜': 'https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=400&h=400&fit=crop', // 蜂蜜
      };
      return imageMap[productName] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop';
    };
    
    grid.innerHTML = main.products
      .map(
        (p, index) => `
      <div class="product-card bg-paper rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm">
        <div class="p-6">
          <div class="flex flex-wrap gap-1 mb-4">
            ${(p.tags || []).map((t) => `<span class="text-xs px-2 py-0.5 rounded-full bg-ochre/15 text-ochre">${t}</span>`).join('')}
          </div>
          <div class="grid md:grid-cols-2 gap-6 mb-4">
            <div class="flex gap-4 items-start">
              <div class="flex-shrink-0 w-24 h-24 bg-mist/40 rounded-xl overflow-hidden">
                <img src="${getProductImage(p.common.name)}" alt="${p.common.name}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'">
              </div>
              <div class="flex-1">
                <p class="text-xs text-stone-500 mb-1">通用产品</p>
                <h4 class="font-medium text-ink mb-2">${p.common.name}</h4>
                <p class="text-sm text-indigo/70">${p.common.desc}</p>
              </div>
            </div>
            <div class="flex gap-4 items-start border-l-2 border-ochre/30 pl-6">
              <div class="flex-shrink-0 w-24 h-24 bg-ochre/10 rounded-xl overflow-hidden">
                <img src="${getProductImage(p.gansu.name)}" alt="${p.gansu.name}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'">
              </div>
              <div class="flex-1">
                <p class="text-xs text-ochre font-medium mb-1">甘肃特产 ⭐</p>
                <h4 class="font-medium text-ink mb-2">${p.gansu.name}</h4>
                <p class="text-sm text-indigo/70">${p.gansu.desc}</p>
              </div>
            </div>
          </div>
          <div class="p-4 bg-ochre/5 rounded-xl">
            <p class="text-sm font-medium text-ochre mb-3">🌟 甘肃特产优势：</p>
            <ul class="text-sm text-indigo/90 space-y-2 mb-4">
              ${(p.advantages || []).map((adv) => `<li class="flex items-start gap-2"><span class="text-ochre mt-1">•</span><span>${adv}</span></li>`).join('')}
            </ul>
            <div class="flex gap-3">
              <button type="button" class="recipe-btn text-sm text-ochre hover:underline" data-product-index="${index}">查看食谱</button>
              <a href="#" class="text-sm px-4 py-2 rounded-full bg-ochre text-white hover:bg-ochre/90 transition">加入购物车</a>
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    // 绑定食谱按钮事件
    document.querySelectorAll('.recipe-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.productIndex);
        showRecipeModal(main.products[index]);
      });
    });

    const recipeBlock = document.getElementById('recipeBlock');
    recipeBlock.querySelector('#recipeName').textContent = main.recipe.name;
    recipeBlock.querySelector('#recipeDesc').textContent = main.recipe.desc;
  }

  // ---------- 食谱弹窗 ----------
  function showRecipeModal(product) {
    if (!product.recipe) {
      alert('该产品暂无食谱');
      return;
    }
    
    const recipe = product.recipe;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50';
    modal.innerHTML = `
      <div class="bg-paper rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-ochre/10 border-b border-ochre/20 p-6 flex justify-between items-center">
          <h3 class="font-serif text-2xl text-ink">${recipe.name}</h3>
          <button type="button" class="close-modal w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600">✕</button>
        </div>
        <div class="p-6 space-y-6">
          <div>
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">📝</span> 食材准备
            </h4>
            <ul class="space-y-2">
              ${recipe.ingredients.map(ing => `<li class="flex items-start gap-2 text-indigo/90"><span class="text-ochre">•</span><span>${ing}</span></li>`).join('')}
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">👨‍🍳</span> 制作步骤
            </h4>
            <ol class="space-y-3">
              ${recipe.steps.map((step, i) => `<li class="flex gap-3"><span class="flex-shrink-0 w-6 h-6 rounded-full bg-ochre/15 text-ochre text-sm flex items-center justify-center">${i + 1}</span><span class="text-indigo/90 flex-1">${step}</span></li>`).join('')}
            </ol>
          </div>
          <div class="p-4 bg-ochre/5 rounded-xl border border-ochre/20">
            <h4 class="font-medium text-ink mb-2 flex items-center gap-2">
              <span class="text-ochre">💡</span> 功效说明
            </h4>
            <p class="text-indigo/90">${recipe.effect}</p>
          </div>
          ${recipe.tips ? `
          <div class="p-4 bg-mist/60 rounded-xl border border-stone-200/60">
            <h4 class="font-medium text-ink mb-2 flex items-center gap-2">
              <span class="text-ochre">⭐</span> 小贴士
            </h4>
            <p class="text-indigo/90">${recipe.tips}</p>
          </div>
          ` : ''}
          <div class="flex gap-3">
            <button type="button" class="flex-1 px-6 py-3 rounded-full bg-ochre text-white hover:bg-ochre/90 transition">一键购买食材</button>
            <button type="button" class="close-modal px-6 py-3 rounded-full border-2 border-stone-300 text-indigo hover:bg-mist transition">关闭</button>
          </div>
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
})();
