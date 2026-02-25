// ai.js - AI 中医顾问功能

// 存储当前用户的体质信息
let currentConstitution = {
    type: '',
    id: '',
    description: '',
    features: '',
    dietRecommend: '',
    principle: '',
    foods: ''
};

// 体质ID到中文名称的映射
const constitutionNames = {
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

// 选择体质类型
window.selectConstitution = function(constitutionId) {
    // 更新按钮样式
    document.querySelectorAll('.constitution-btn').forEach(btn => {
        if (btn.dataset.constitution === constitutionId) {
            btn.classList.add('border-ochre', 'bg-ochre/10', 'font-medium');
            btn.classList.remove('border-stone-200');
        } else {
            btn.classList.remove('border-ochre', 'bg-ochre/10', 'font-medium');
            btn.classList.add('border-stone-200');
        }
    });
    
    // 从data.js获取体质数据
    if (window.CONSTITUTION_DATA && window.CONSTITUTION_DATA[constitutionId]) {
        const data = window.CONSTITUTION_DATA[constitutionId];
        currentConstitution = {
            type: data.name,
            id: constitutionId,
            description: data.desc,
            features: data.features,
            dietRecommend: data.dietRecommend,
            principle: data.principle,
            foods: data.foods,
            cause: data.cause,
            risks: data.risks
        };
        
        // 清空对话框并显示新的欢迎消息
        const chatBox = document.getElementById('aiChatBox');
        if (chatBox) {
            chatBox.innerHTML = `
                <div class="flex gap-3">
                    <div class="w-8 h-8 rounded-full bg-ochre/20 flex items-center justify-center flex-shrink-0">
                        <span class="text-sm">🤖</span>
                    </div>
                    <div class="flex-1 bg-mist/80 rounded-2xl rounded-tl-none p-3">
                        <p class="text-sm text-ink">您好！我已了解您是<strong>${data.name}</strong>。我可以为您解答关于饮食、运动、养生等方面的问题。请随时提问！</p>
                    </div>
                </div>
            `;
        }
    }
}

// 初始化AI模块（在显示测试结果时调用）
window.initAIConsultation = function(constitutionData) {
    currentConstitution = constitutionData;
    
    // 更新AI欢迎消息中的体质类型
    const constitutionTypeSpan = document.getElementById('aiConstitutionType');
    if (constitutionTypeSpan) {
        constitutionTypeSpan.textContent = constitutionData.type;
    }
    
    // 清空之前的对话（保留欢迎消息）
    const chatBox = document.getElementById('aiChatBox');
    if (chatBox) {
        const welcomeMsg = chatBox.querySelector('.flex');
        chatBox.innerHTML = '';
        if (welcomeMsg) {
            chatBox.appendChild(welcomeMsg);
        }
    }
}

// 发送问题给AI
window.askAI = async function(predefinedQuestion = null) {
    const input = document.getElementById('aiQuestionInput');
    const question = predefinedQuestion || input.value.trim();
    
    if (!question) {
        return;
    }
    
    // 检查是否已选择体质
    if (!currentConstitution.type) {
        addMessageToChat('ai', '请先选择您的体质类型，或者<a href="#test" class="text-ochre hover:underline">完成体质测试</a>后再提问。');
        return;
    }
    
    // 清空输入框
    if (!predefinedQuestion) {
        input.value = '';
    }
    
    // 显示用户问题
    addMessageToChat('user', question);
    
    // 显示"正在思考"动画
    const thinkingId = addMessageToChat('ai', '<span class="ai-typing">正在思考...</span>');
    
    // 模拟AI响应（这里使用本地知识库，你也可以接入真实的AI API）
    setTimeout(() => {
        const response = generateAIResponse(question);
        removeMessage(thinkingId);
        addMessageToChat('ai', response);
    }, 1000 + Math.random() * 1000);
}

// 添加消息到聊天框
function addMessageToChat(sender, content) {
    const chatBox = document.getElementById('aiChatBox');
    const messageId = 'msg-' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = 'flex gap-3';
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="flex-1 flex justify-end">
                <div class="bg-ochre/15 rounded-2xl rounded-tr-none p-3 max-w-[80%]">
                    <p class="text-sm text-ink">${content}</p>
                </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-indigo/20 flex items-center justify-center flex-shrink-0">
                <span class="text-sm">👤</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-ochre/20 flex items-center justify-center flex-shrink-0">
                <span class="text-sm">🤖</span>
            </div>
            <div class="flex-1 bg-mist/80 rounded-2xl rounded-tl-none p-3">
                <p class="text-sm text-ink">${content}</p>
            </div>
        `;
    }
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return messageId;
}

// 移除消息
function removeMessage(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
        message.remove();
    }
}

// 生成AI响应（基于本地知识库）
function generateAIResponse(question) {
    const q = question.toLowerCase();
    const type = currentConstitution.type;
    
    // 体质特定的知识库
    const knowledgeBase = {
        '阳虚质': {
            fruits: '建议吃温性水果，如：荔枝、龙眼、桃子、樱桃、榴莲、杏子。避免寒凉水果如西瓜、梨、柚子等。',
            exercise: '适合温和的运动，如散步、太极拳、八段锦。避免大汗淋漓的剧烈运动。运动时注意保暖，避免受寒。',
            diet: '多吃温热性食物：羊肉、牛肉、韭菜、生姜、肉桂、核桃。少吃生冷寒凉食物。',
            lifestyle: '注意保暖，尤其是腹部、腰部、足部。避免长时间待在空调房。早睡早起，保证充足睡眠。',
            recipe: '推荐：当归生姜羊肉汤、韭菜炒核桃仁、桂圆红枣茶。'
        },
        '阴虚质': {
            fruits: '适合吃滋阴水果：梨、甘蔗、葡萄、桑葚、枸杞、百合。避免温燥水果如荔枝、榴莲。',
            exercise: '适合柔和的运动，如瑜伽、游泳、慢跑。避免高强度运动导致出汗过多。',
            diet: '多吃滋阴食物：银耳、百合、莲子、鸭肉、海参、黑芝麻。少吃辛辣燥热食物。',
            lifestyle: '保持环境湿润，避免熬夜。多喝水，保持情绪平和。避免过度劳累。',
            recipe: '推荐：银耳莲子羹、百合粥、沙参玉竹老鸭汤。'
        },
        '气虚质': {
            fruits: '适合吃补气水果：大枣、葡萄、樱桃、苹果、桂圆。避免过于寒凉的水果。',
            exercise: '适合轻度运动，如散步、慢跑、太极。循序渐进，避免过度疲劳。',
            diet: '多吃补气食物：黄芪、党参、山药、红枣、鸡肉、牛肉。少吃耗气食物。',
            lifestyle: '规律作息，避免过度劳累。保持心情愉悦，适当午休。注意防寒保暖。',
            recipe: '推荐：黄芪炖鸡、山药粥、党参红枣茶。'
        },
        '痰湿质': {
            fruits: '适合吃化痰水果：柚子、橙子、山楂、柠檬、枇杷。避免过甜水果如榴莲、芒果。',
            exercise: '需要加强运动，如快走、慢跑、游泳、爬山。每周至少3-5次，每次30分钟以上。',
            diet: '多吃健脾化湿食物：薏米、冬瓜、白萝卜、海带、陈皮。少吃油腻甜食。',
            lifestyle: '控制体重，清淡饮食。保持居住环境干燥通风。戒烟限酒。',
            recipe: '推荐：薏米红豆粥、冬瓜排骨汤、陈皮茶。'
        },
        '湿热质': {
            fruits: '适合吃清热水果：西瓜、梨、柚子、猕猴桃、火龙果。避免热性水果如荔枝、榴莲。',
            exercise: '适合中等强度运动，如游泳、跑步、球类运动。有助于排汗祛湿。',
            diet: '多吃清热利湿食物：绿豆、苦瓜、冬瓜、薏米、芹菜。少吃辛辣油腻食物。',
            lifestyle: '保持清淡饮食，避免熬夜。保持居住环境通风干燥。戒烟限酒。',
            recipe: '推荐：绿豆汤、苦瓜炒蛋、薏米冬瓜汤。'
        },
        '血瘀质': {
            fruits: '适合吃活血水果：山楂、葡萄、柠檬、橙子、草莓。',
            exercise: '需要规律运动，如慢跑、游泳、舞蹈、太极。促进血液循环。',
            diet: '多吃活血化瘀食物：山楂、黑木耳、红花、桃仁、红糖、醋。少吃寒凉食物。',
            lifestyle: '保持心情舒畅，避免久坐。注意保暖，避免受寒。规律作息。',
            recipe: '推荐：山楂红糖水、黑木耳炒肉、桃仁粥。'
        },
        '气郁质': {
            fruits: '适合吃疏肝水果：柑橘、柚子、金桔、柠檬、玫瑰花茶。',
            exercise: '适合舒缓运动，如瑜伽、太极、散步、游泳。有助于疏肝解郁。',
            diet: '多吃疏肝理气食物：玫瑰花、佛手、陈皮、萝卜、柑橘。少吃辛辣刺激食物。',
            lifestyle: '保持心情愉悦，多与人交流。培养兴趣爱好，听音乐、旅游。规律作息。',
            recipe: '推荐：玫瑰花茶、佛手茶、陈皮粥。'
        },
        '特禀质': {
            fruits: '根据过敏情况选择，避免已知过敏水果。建议：苹果、香蕉、葡萄等常见水果。',
            exercise: '适合温和运动，如散步、太极、瑜伽。避免在花粉多的环境运动。',
            diet: '避免已知过敏食物。多吃增强免疫力食物：灵芝、黄芪、大枣、蜂蜜。',
            lifestyle: '避免接触过敏原，保持居住环境清洁。规律作息，增强体质。',
            recipe: '推荐：黄芪红枣茶、灵芝汤、蜂蜜水。'
        },
        '平和质': {
            fruits: '各种水果均可适量食用，保持多样化。',
            exercise: '可以进行各种运动，保持规律锻炼，每周3-5次。',
            diet: '保持均衡饮食，五谷杂粮、蔬菜水果、肉蛋奶合理搭配。',
            lifestyle: '保持良好作息，规律运动，心情愉悦。继续保持健康的生活方式。',
            recipe: '推荐：五谷杂粮粥、时令蔬菜、清蒸鱼。'
        }
    };
    
    const kb = knowledgeBase[type] || knowledgeBase['平和质'];
    
    // 关键词匹配
    if (q.includes('水果') || q.includes('果')) {
        return `<strong>🍎 ${type}适合的水果：</strong><br/>${kb.fruits}`;
    }
    
    if (q.includes('运动') || q.includes('锻炼') || q.includes('健身')) {
        return `<strong>🏃 ${type}的运动建议：</strong><br/>${kb.exercise}`;
    }
    
    if (q.includes('食疗') || q.includes('食谱') || q.includes('方子')) {
        return `<strong>🍲 ${type}的食疗方：</strong><br/>${kb.recipe}`;
    }
    
    if (q.includes('饮食') || q.includes('吃') || q.includes('食物')) {
        return `<strong>🥗 ${type}的饮食建议：</strong><br/>${kb.diet}`;
    }
    
    if (q.includes('生活') || q.includes('注意') || q.includes('日常') || q.includes('起居')) {
        return `<strong>💡 ${type}的生活建议：</strong><br/>${kb.lifestyle}`;
    }
    
    if (q.includes('症状') || q.includes('表现') || q.includes('特征')) {
        return `<strong>📋 ${type}的特征：</strong><br/>${currentConstitution.features || '暂无详细信息'}`;
    }
    
    if (q.includes('原因') || q.includes('为什么') || q.includes('成因')) {
        return `<strong>💭 ${type}的形成原因：</strong><br/>${currentConstitution.cause || '暂无详细信息'}`;
    }
    
    if (q.includes('调理') || q.includes('改善') || q.includes('治疗')) {
        return `<strong>⚕️ ${type}的调理建议：</strong><br/>${currentConstitution.principle || '暂无详细信息'}<br/><br/><strong>推荐食物：</strong>${currentConstitution.foods || '暂无详细信息'}`;
    }
    
    // 默认综合回答
    return `<strong>关于${type}的建议：</strong><br/><br/>
            <strong>🥗 饮食：</strong>${kb.diet}<br/><br/>
            <strong>🏃 运动：</strong>${kb.exercise}<br/><br/>
            <strong>💡 生活：</strong>${kb.lifestyle}<br/><br/>
            如需更详细的建议，请具体提问，比如"适合吃什么水果"、"如何运动"等。`;
}

// 导出函数供其他模块使用
window.AIConsultation = {
    init: initAIConsultation,
    ask: askAI
};

