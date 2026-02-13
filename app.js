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

  /** 根据得分判断调理程度：轻度(40-64)、中度(65-84)、重度(≥85) */
  function getAdjustmentLevel(score) {
    if (score < 40) return null; // 无需特别调理
    if (score < 65) return 'mild'; // 轻度
    if (score < 85) return 'moderate'; // 中度
    return 'severe'; // 重度
  }

  function computeAndShowResult() {
    const scores = computeScores();
    const mainId = getMainConstitution(scores);
    const main = DATA[mainId];
    const secondaryIds = getSecondaryConstitutions(scores, mainId);
    
    // 判断调理程度（平和质不需要调理程度判断）
    const mainScore = scores[mainId];
    const adjustmentLevel = mainId === 'pinghe' ? null : getAdjustmentLevel(mainScore);

    document.getElementById('resultTitle').textContent = main.name;
    document.getElementById('resultDesc').textContent = main.desc;
    const dietEl = document.getElementById('resultDietRecommend');
    if (dietEl && main.dietRecommend) dietEl.textContent = main.dietRecommend;
    document.getElementById('resultFeatures').textContent = main.features;
    document.getElementById('resultCause').textContent = main.cause;
    document.getElementById('resultRisks').textContent = main.risks;
    
    // 显示调理程度建议
    displayAdjustmentRecommendation(mainId, mainScore, adjustmentLevel);

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

    // 保存测试结果到 Supabase
    if (window.saveUserResult) {
      const testResult = {
        timestamp: new Date().toISOString(),
        constitution: main.name,
        constitutionId: mainId,
        description: main.desc,
        scores: scores,
        adjustmentLevel: adjustmentLevel,
        secondaryConstitutions: secondaryIds.map(id => DATA[id].name),
        dietRecommend: main.dietRecommend,
        features: main.features,
        cause: main.cause,
        risks: main.risks,
        principle: main.principle,
        foods: main.foods
      };
      
      // 异步保存，不阻塞界面显示
      window.saveUserResult(testResult).then(success => {
        if (success) {
          console.log('测试结果已保存到云端');
        }
      });
    }

    showSection('result');
    renderProducts(mainId, adjustmentLevel);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** 显示调理程度建议 */
  function displayAdjustmentRecommendation(constitutionId, score, level) {
    const container = document.getElementById('adjustmentRecommendation');
    if (!container) return;
    
    if (constitutionId === 'pinghe' || !level) {
      container.classList.add('hidden');
      return;
    }
    
    container.classList.remove('hidden');
    
    const levelConfig = {
      mild: {
        title: '轻度调理建议',
        icon: '🍵',
        color: 'bg-green-50 border-green-200',
        textColor: 'text-green-800',
        badgeColor: 'bg-green-100 text-green-700',
        description: '您的体质偏颇程度较轻（得分40-64），建议通过日常茶饮调理即可改善。',
        recommendation: '推荐饮用养生茶饮，配合规律作息和适度运动。',
        action: '查看茶饮推荐'
      },
      moderate: {
        title: '中度调理建议',
        icon: '🌿',
        color: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-800',
        badgeColor: 'bg-yellow-100 text-yellow-700',
        description: '您的体质偏颇程度中等（得分65-84），建议采用产品组合进行系统调理。',
        recommendation: '推荐使用食疗产品组合，坚持调理3-6个月可见明显改善。',
        action: '查看产品组合'
      },
      severe: {
        title: '重度调理建议',
        icon: '🏥',
        color: 'bg-red-50 border-red-200',
        textColor: 'text-red-800',
        badgeColor: 'bg-red-100 text-red-700',
        description: '您的体质偏颇程度较重（得分≥85），建议前往专业中医机构进行诊疗。',
        recommendation: '建议线下就医，由专业中医师进行辨证施治，制定个性化调理方案。',
        action: '查找附近医院'
      }
    };
    
    const config = levelConfig[level];
    
    container.innerHTML = `
      <div class="card ${config.color} border-2 p-6 rounded-2xl">
        <div class="flex items-start gap-4">
          <div class="text-4xl">${config.icon}</div>
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <h3 class="font-serif text-xl ${config.textColor}">${config.title}</h3>
              <span class="text-sm px-3 py-1 rounded-full ${config.badgeColor} font-medium">得分：${score}</span>
            </div>
            <p class="${config.textColor} mb-3">${config.description}</p>
            <p class="${config.textColor} font-medium mb-4">${config.recommendation}</p>
            <button type="button" class="adjustment-action-btn px-6 py-2 rounded-full bg-ochre text-white hover:bg-ochre/90 transition" data-level="${level}">
              ${config.action}
            </button>
          </div>
        </div>
      </div>
    `;
    
    // 绑定按钮事件
    const actionBtn = container.querySelector('.adjustment-action-btn');
    actionBtn.addEventListener('click', function() {
      const level = this.dataset.level;
      handleAdjustmentAction(level, constitutionId);
    });
  }

  /** 处理调理建议按钮点击 */
  function handleAdjustmentAction(level, constitutionId) {
    if (level === 'mild') {
      // 轻度：滚动到茶饮推荐区域
      const teaSection = document.getElementById('teaRecommendation');
      if (teaSection) {
        teaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (level === 'moderate') {
      // 中度：滚动到产品推荐区域
      const productsSection = document.getElementById('products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (level === 'severe') {
      // 重度：显示就医指引弹窗
      showMedicalGuidanceModal(constitutionId);
    }
  }

  /** 显示就医指引弹窗 */
  function showMedicalGuidanceModal(constitutionId) {
    const main = DATA[constitutionId];
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50';
    modal.innerHTML = `
      <div class="bg-paper rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-red-50 border-b border-red-200 p-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🏥</span>
            <h3 class="font-serif text-2xl text-red-800">就医指引</h3>
          </div>
          <button type="button" class="close-modal w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600">✕</button>
        </div>
        <div class="p-6 space-y-6">
          <div class="p-4 bg-red-50 border-l-4 border-red-400 rounded">
            <p class="text-red-800 font-medium mb-2">⚠️ 重要提示</p>
            <p class="text-red-700">您的【${main.name}】体质偏颇程度较重，建议尽快前往专业中医机构进行诊疗，以获得更精准的辨证施治方案。</p>
          </div>
          
          <div>
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">📋</span> 就诊建议
            </h4>
            <ul class="space-y-2 text-indigo/90">
              <li class="flex items-start gap-2"><span class="text-ochre">•</span><span>选择正规中医医院或综合医院中医科</span></li>
              <li class="flex items-start gap-2"><span class="text-ochre">•</span><span>挂号时选择"中医体质调理"或"中医内科"</span></li>
              <li class="flex items-start gap-2"><span class="text-ochre">•</span><span>携带本次测试结果，便于医生参考</span></li>
              <li class="flex items-start gap-2"><span class="text-ochre">•</span><span>准备详细描述近期身体状况和不适症状</span></li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">🏥</span> 推荐就诊科室
            </h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-mist/60 rounded-lg border border-stone-200">
                <p class="font-medium text-ink mb-1">中医内科</p>
                <p class="text-sm text-indigo/70">体质调理、慢性病调养</p>
              </div>
              <div class="p-3 bg-mist/60 rounded-lg border border-stone-200">
                <p class="font-medium text-ink mb-1">中医治未病科</p>
                <p class="text-sm text-indigo/70">体质辨识、预防保健</p>
              </div>
              <div class="p-3 bg-mist/60 rounded-lg border border-stone-200">
                <p class="font-medium text-ink mb-1">中医养生科</p>
                <p class="text-sm text-indigo/70">养生调理、膏方定制</p>
              </div>
              <div class="p-3 bg-mist/60 rounded-lg border border-stone-200">
                <p class="font-medium text-ink mb-1">针灸推拿科</p>
                <p class="text-sm text-indigo/70">经络调理、穴位治疗</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="font-medium text-ink mb-3 flex items-center gap-2">
              <span class="text-ochre">⚕️</span> 可能的治疗方案
            </h4>
            <div class="space-y-2 text-indigo/90">
              <p class="flex items-start gap-2"><span class="text-ochre">•</span><span><strong>中药调理：</strong>根据体质开具个性化中药方剂</span></p>
              <p class="flex items-start gap-2"><span class="text-ochre">•</span><span><strong>针灸治疗：</strong>通过穴位刺激调节脏腑功能</span></p>
              <p class="flex items-start gap-2"><span class="text-ochre">•</span><span><strong>推拿按摩：</strong>疏通经络、调和气血</span></p>
              <p class="flex items-start gap-2"><span class="text-ochre">•</span><span><strong>膏方调养：</strong>长期服用，缓慢调理体质</span></p>
              <p class="flex items-start gap-2"><span class="text-ochre">•</span><span><strong>食疗指导：</strong>专业营养师制定饮食方案</span></p>
            </div>
          </div>
          
          <div class="p-4 bg-ochre/5 rounded-xl border border-ochre/20">
            <h4 class="font-medium text-ink mb-2 flex items-center gap-2">
              <span class="text-ochre">💡</span> 温馨提示
            </h4>
            <p class="text-indigo/90 text-sm">体质调理是一个循序渐进的过程，需要耐心和坚持。在专业医生指导下，配合规律作息、适度运动和合理饮食，您的体质状况会逐步改善。</p>
          </div>
          
          <div class="flex gap-3">
            <button type="button" class="flex-1 px-6 py-3 rounded-full bg-ochre text-white hover:bg-ochre/90 transition" onclick="window.open('https://www.haodf.com/', '_blank')">在线预约挂号</button>
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

  // ---------- 产品推荐 ----------
  function renderProducts(constitutionId, adjustmentLevel) {
    const main = DATA[constitutionId];
    if (!main) return;
    
    // 根据调理程度显示不同内容
    if (adjustmentLevel === 'mild') {
      // 轻度：显示茶饮推荐
      renderTeaRecommendation(constitutionId);
      document.getElementById('products').classList.add('hidden');
    } else if (adjustmentLevel === 'moderate' || adjustmentLevel === 'severe') {
      // 中度和重度：显示产品组合（重度也显示，但会有就医提示）
      document.getElementById('products').classList.remove('hidden');
      document.getElementById('productsTitle').textContent = `【${main.name}】的专属食疗方案`;
      document.getElementById('principleText').textContent = main.principle;
      document.getElementById('foodsText').textContent = main.foods;
    } else {
      // 平和质或无需调理：显示常规产品
      document.getElementById('products').classList.remove('hidden');
      document.getElementById('productsTitle').textContent = `【${main.name}】的专属食疗方案`;
      document.getElementById('principleText').textContent = main.principle;
      document.getElementById('foodsText').textContent = main.foods;
    }
    
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
              <button type="button" class="add-to-cart-btn text-sm px-4 py-2 rounded-full bg-ochre text-white hover:bg-ochre/90 transition" 
                      data-product-index="${index}" 
                      data-product-type="gansu">加入购物车</button>
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

    // 绑定加入购物车按钮事件
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.productIndex);
        const productType = this.dataset.productType;
        const product = main.products[index];
        
        // 构造购物车商品对象
        const cartProduct = {
          id: `${constitutionId}-${index}-${productType}`,
          name: product.gansu.name,
          type: 'gansu',
          price: 29.90 + (index * 5), // 示例价格
          image: getProductImage(product.gansu.name),
          description: product.gansu.desc
        };
        
        // 调用购物车添加函数
        if (window.addToCart) {
          window.addToCart(cartProduct);
        }
      });
    });

    const recipeBlock = document.getElementById('recipeBlock');
    recipeBlock.querySelector('#recipeName').textContent = main.recipe.name;
    recipeBlock.querySelector('#recipeDesc').textContent = main.recipe.desc;
  }

  /** 渲染茶饮推荐（轻度调理） */
  function renderTeaRecommendation(constitutionId) {
    const main = DATA[constitutionId];
    if (!main) return;
    
    // 定义各体质的茶饮推荐
    const teaRecommendations = {
      qixu: [
        {
          name: '黄芪红枣茶',
          ingredients: ['陇西黄芪 10克', '临泽红枣 5颗', '枸杞 5克', '开水 500ml'],
          effect: '补气健脾，增强体质',
          method: '黄芪和红枣放入茶壶，倒入开水焖泡15分钟，加入枸杞即可饮用。',
          tips: '每日1-2次，饭后饮用效果更佳。',
          image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop'
        },
        {
          name: '党参桂圆茶',
          ingredients: ['党参 10克', '桂圆肉 10克', '红糖 适量', '开水 500ml'],
          effect: '补气养血，改善疲劳',
          method: '党参和桂圆放入茶壶，倒入开水焖泡10分钟，加红糖调味。',
          tips: '适合下午饮用，提神补气。',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'
        }
      ],
      yangxu: [
        {
          name: '生姜红糖茶',
          ingredients: ['天水生姜 20克', '红糖 15克', '红枣 3颗', '开水 500ml'],
          effect: '温阳散寒，暖胃驱寒',
          method: '生姜切片，与红枣一起煮水10分钟，加红糖调味。',
          tips: '早上空腹饮用效果最佳，晚上不宜。',
          image: 'https://images.unsplash.com/photo-1597318181274-c6f1a6d6e3d2?w=400&h=400&fit=crop'
        },
        {
          name: '桂圆枸杞茶',
          ingredients: ['桂圆肉 15克', '民勤枸杞 10克', '红枣 5颗', '开水 500ml'],
          effect: '温补肾阳，养血安神',
          method: '所有食材放入茶壶，倒入开水焖泡15分钟即可。',
          tips: '可反复冲泡2-3次。',
          image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=400&fit=crop'
        }
      ],
      yinxu: [
        {
          name: '麦冬百合茶',
          ingredients: ['麦冬 10克', '兰州百合 10克', '枸杞 5克', '冰糖 适量', '开水 500ml'],
          effect: '滋阴润燥，清心安神',
          method: '麦冬和百合放入茶壶，倒入开水焖泡10分钟，加枸杞和冰糖。',
          tips: '下午或睡前饮用，有助改善睡眠。',
          image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop'
        },
        {
          name: '石斛菊花茶',
          ingredients: ['石斛 5克', '菊花 5克', '枸杞 5克', '蜂蜜 适量', '开水 500ml'],
          effect: '养阴明目，清热生津',
          method: '石斛和菊花放入茶壶，倒入开水焖泡10分钟，待温后加蜂蜜。',
          tips: '适合长期用眼人群。',
          image: 'https://images.unsplash.com/photo-1597318181274-c6f1a6d6e3d2?w=400&h=400&fit=crop'
        }
      ],
      tanshi: [
        {
          name: '陈皮荷叶茶',
          ingredients: ['陈皮 5克', '荷叶 5克', '山楂 10克', '开水 500ml'],
          effect: '健脾祛湿，消食化积',
          method: '所有食材放入茶壶，倒入开水焖泡10分钟即可。',
          tips: '饭后饮用，有助消化。',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'
        },
        {
          name: '薏米茯苓茶',
          ingredients: ['炒薏米 15克', '茯苓 10克', '陈皮 3克', '开水 500ml'],
          effect: '利水渗湿，健脾和胃',
          method: '薏米和茯苓煮水15分钟，加入陈皮焖泡5分钟。',
          tips: '每日1-2次，坚持饮用效果更佳。',
          image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop'
        }
      ],
      shire: [
        {
          name: '绿豆菊花茶',
          ingredients: ['定西绿豆 30克', '菊花 5克', '冰糖 适量', '清水 800ml'],
          effect: '清热利湿，解毒降火',
          method: '绿豆煮水30分钟，加入菊花焖泡5分钟，加冰糖调味。',
          tips: '放凉后饮用效果更佳。',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'
        },
        {
          name: '陇南绿茶',
          ingredients: ['陇南绿茶 5克', '薄荷叶 3片', '柠檬 2片', '开水 500ml'],
          effect: '清热利尿，疏肝解郁',
          method: '绿茶用80度水冲泡，加入薄荷和柠檬焖泡5分钟。',
          tips: '不要用沸水，以免破坏营养。',
          image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop'
        }
      ],
      xueyu: [
        {
          name: '玫瑰山楂茶',
          ingredients: ['苦水玫瑰 6朵', '天水山楂 10克', '红糖 适量', '开水 500ml'],
          effect: '活血化瘀，疏肝理气',
          method: '山楂煮水10分钟，加入玫瑰花焖泡5分钟，加红糖调味。',
          tips: '经期前一周开始饮用。',
          image: 'https://images.unsplash.com/photo-1597318181274-c6f1a6d6e3d2?w=400&h=400&fit=crop'
        },
        {
          name: '红花当归茶',
          ingredients: ['红花 3克', '当归 5克', '红枣 5颗', '开水 500ml'],
          effect: '活血通络，补血养颜',
          method: '所有食材放入茶壶，倒入开水焖泡15分钟即可。',
          tips: '孕妇禁用。',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'
        }
      ],
      qiyu: [
        {
          name: '玫瑰佛手茶',
          ingredients: ['苦水玫瑰 8朵', '佛手 5克', '陈皮 3克', '蜂蜜 适量', '开水 500ml'],
          effect: '疏肝解郁，理气和中',
          method: '佛手和陈皮放入茶壶，倒入开水焖泡10分钟，加玫瑰花，待温后加蜂蜜。',
          tips: '饭后饮用，有助舒缓情绪。',
          image: 'https://images.unsplash.com/photo-1597318181274-c6f1a6d6e3d2?w=400&h=400&fit=crop'
        },
        {
          name: '薄荷柠檬茶',
          ingredients: ['陇南薄荷 10片', '柠檬 半个', '蜂蜜 适量', '开水 500ml'],
          effect: '清心疏肝，提神醒脑',
          method: '薄荷和柠檬片放入茶壶，倒入开水焖泡5分钟，待温后加蜂蜜。',
          tips: '下午饮用，缓解压力。',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'
        }
      ],
      tebing: [
        {
          name: '黄芪防风茶',
          ingredients: ['陇西黄芪 15克', '防风 10克', '白术 10克', '红枣 5颗', '开水 500ml'],
          effect: '益气固表，增强免疫',
          method: '所有食材放入茶壶，倒入开水焖泡15分钟即可。',
          tips: '长期饮用可减少过敏发作。',
          image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop'
        },
        {
          name: '蜂蜜柠檬茶',
          ingredients: ['陇南土蜂蜜 20克', '柠檬 半个', '温水 500ml'],
          effect: '润肺止咳，缓解过敏',
          method: '柠檬切片，用温水（不超过60度）冲泡，加入蜂蜜搅拌均匀。',
          tips: '水温不要太高，以免破坏蜂蜜营养。',
          image: 'https://images.unsplash.com/photo-1597318181274-c6f1a6d6e3d2?w=400&h=400&fit=crop'
        }
      ],
      pinghe: [
        {
          name: '五花茶',
          ingredients: ['菊花 3克', '金银花 3克', '玫瑰花 3克', '茉莉花 3克', '桂花 3克', '开水 500ml'],
          effect: '清心润肺，平衡调和',
          method: '所有花茶放入茶壶，倒入开水焖泡5分钟即可。',
          tips: '四季皆宜，保持平和。',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'
        },
        {
          name: '红枣枸杞茶',
          ingredients: ['红枣 5颗', '枸杞 10克', '桂圆 5克', '开水 500ml'],
          effect: '补气养血，保持健康',
          method: '红枣去核，与枸杞、桂圆一起放入茶壶，倒入开水焖泡10分钟。',
          tips: '日常保健，适量饮用。',
          image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop'
        }
      ]
    };
    
    const teas = teaRecommendations[constitutionId] || [];
    
    const teaSection = document.getElementById('teaRecommendation');
    if (!teaSection) {
      // 如果没有茶饮推荐区域，创建一个
      const productsSection = document.getElementById('products');
      const newSection = document.createElement('section');
      newSection.id = 'teaRecommendation';
      newSection.className = 'mb-16';
      productsSection.parentNode.insertBefore(newSection, productsSection);
    }
    
    document.getElementById('teaRecommendation').innerHTML = `
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 mb-4">
          <span class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">🍵</span>
        </div>
        <h2 class="font-serif text-3xl mb-3">【${main.name}】茶饮调理方案</h2>
        <p class="text-indigo/80 max-w-2xl mx-auto">轻度调理建议：通过日常茶饮温和调理，配合规律作息和适度运动，坚持3个月可见改善。</p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        ${teas.map(tea => `
          <div class="card bg-paper rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm hover:shadow-md transition">
            <div class="h-48 overflow-hidden">
              <img src="${tea.image}" alt="${tea.name}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop'">
            </div>
            <div class="p-6">
              <h3 class="font-serif text-xl text-ink mb-3">${tea.name}</h3>
              <div class="space-y-3 text-sm">
                <div>
                  <p class="font-medium text-ochre mb-2">🌿 配方</p>
                  <ul class="space-y-1 text-indigo/80">
                    ${tea.ingredients.map(ing => `<li class="flex items-start gap-2"><span class="text-ochre">•</span><span>${ing}</span></li>`).join('')}
                  </ul>
                </div>
                <div>
                  <p class="font-medium text-ochre mb-1">💡 功效</p>
                  <p class="text-indigo/80">${tea.effect}</p>
                </div>
                <div>
                  <p class="font-medium text-ochre mb-1">👨‍🍳 制作方法</p>
                  <p class="text-indigo/80">${tea.method}</p>
                </div>
                ${tea.tips ? `
                <div class="p-3 bg-ochre/5 rounded-lg border border-ochre/20">
                  <p class="font-medium text-ochre mb-1">⭐ 小贴士</p>
                  <p class="text-indigo/80">${tea.tips}</p>
                </div>
                ` : ''}
              </div>
              <button type="button" class="mt-4 w-full px-6 py-2 rounded-full bg-ochre text-white hover:bg-ochre/90 transition">
                一键购买食材
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="card bg-green-50 border-2 border-green-200 p-6 rounded-2xl">
        <h3 class="font-medium text-green-800 mb-3 flex items-center gap-2">
          <span class="text-2xl">📝</span> 饮用建议
        </h3>
        <ul class="space-y-2 text-green-700">
          <li class="flex items-start gap-2"><span class="text-green-600">•</span><span>每日饮用1-2次，建议上午和下午各一次</span></li>
          <li class="flex items-start gap-2"><span class="text-green-600">•</span><span>坚持饮用3个月为一个调理周期</span></li>
          <li class="flex items-start gap-2"><span class="text-green-600">•</span><span>可根据个人口味适当调整配方用量</span></li>
          <li class="flex items-start gap-2"><span class="text-green-600">•</span><span>配合规律作息、适度运动效果更佳</span></li>
          <li class="flex items-start gap-2"><span class="text-green-600">•</span><span>如症状加重或无改善，建议及时就医</span></li>
        </ul>
      </div>
    `;
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
            <button type="button" class="buy-recipe-ingredients-btn flex-1 px-6 py-3 rounded-full bg-ochre text-white hover:bg-ochre/90 transition">一键购买食材</button>
            <button type="button" class="close-modal px-6 py-3 rounded-full border-2 border-stone-300 text-indigo hover:bg-mist transition">关闭</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定一键购买食材按钮事件
    const buyBtn = modal.querySelector('.buy-recipe-ingredients-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        buyRecipeIngredients(recipe, product);
        modal.remove();
      });
    }
    
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

  /** 一键购买食谱食材 */
  function buyRecipeIngredients(recipe, product) {
    if (!recipe || !recipe.ingredients) {
      alert('食谱信息不完整');
      return;
    }
    
    // 解析食材列表，提取食材名称
    const ingredients = recipe.ingredients.map((ing, index) => {
      // 从字符串中提取食材名称（去掉数量）
      const match = ing.match(/^([^\d]+)/);
      const name = match ? match[1].trim() : ing;
      
      return {
        id: `recipe-${recipe.name}-${index}`,
        name: name,
        type: 'ingredient',
        price: 9.90 + (index * 2), // 示例价格
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop',
        description: `${recipe.name}所需食材`
      };
    });
    
    // 批量添加到购物车
    if (window.addToCart) {
      let addedCount = 0;
      ingredients.forEach(ingredient => {
        window.addToCart(ingredient);
        addedCount++;
      });
      
      // 显示成功提示
      if (addedCount > 0) {
        alert(`已将 ${recipe.name} 的 ${addedCount} 种食材添加到购物车！`);
        // 自动打开购物车
        if (window.showCartModal) {
          setTimeout(() => {
            window.showCartModal();
          }, 500);
        }
      }
    }
  }
})();
