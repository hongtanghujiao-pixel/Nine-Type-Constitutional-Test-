// ai.js - AI 中医顾问功能

// ==================== API 配置 ====================
const AI_CONFIG = {
    apiKey: 'sk-t1fEKFpgmjj3FjY3hTD3ydecgtNwAhqEs0Re7Ep7zDgCQhT9',
    baseURL: 'https://api.silra.cn/v1',
    model: 'deepseek-chat', // 可选：deepseek-chat 或 Qwen3-235B-A22B
    maxTokens: 2000,
    temperature: 0.7
};

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

// 存储用户个人信息
let userProfile = {
    age: '',
    gender: '',
    tastePreference: ''
};

// 存储对话历史
let conversationHistory = [];

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
    
    // 获取用户个人信息
    updateUserProfile();
    
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
        
        // 重置对话历史
        conversationHistory = [];
        
        // 构建欢迎消息
        let welcomeMsg = `您好！我已了解您是<strong>${data.name}</strong>。`;
        
        // 添加个人信息到欢迎消息
        if (userProfile.age || userProfile.gender || userProfile.tastePreference) {
            welcomeMsg += '<br/>根据您提供的信息：';
            if (userProfile.age) welcomeMsg += `年龄${userProfile.age}岁`;
            if (userProfile.gender) {
                const genderText = userProfile.gender === 'male' ? '男性' : '女性';
                welcomeMsg += `、${genderText}`;
            }
            if (userProfile.tastePreference) {
                const tasteMap = {
                    'light': '清淡口味',
                    'spicy': '偏辣口味',
                    'sweet': '偏甜口味',
                    'salty': '偏咸口味',
                    'sour': '偏酸口味'
                };
                welcomeMsg += `、${tasteMap[userProfile.tastePreference]}`;
            }
            welcomeMsg += '，我会为您提供更个性化的建议。';
        }
        
        welcomeMsg += '<br/>我可以为您解答关于饮食、运动、养生等方面的问题。请随时提问！';
        
        // 清空对话框并显示新的欢迎消息
        const chatBox = document.getElementById('aiChatBox');
        if (chatBox) {
            chatBox.innerHTML = `
                <div class="flex gap-3">
                    <div class="w-8 h-8 rounded-full bg-ochre/20 flex items-center justify-center flex-shrink-0">
                        <span class="text-sm">🤖</span>
                    </div>
                    <div class="flex-1 bg-mist/80 rounded-2xl rounded-tl-none p-3">
                        <p class="text-sm text-ink">${welcomeMsg}</p>
                    </div>
                </div>
            `;
        }
    }
}

// 更新用户个人信息
function updateUserProfile() {
    const ageInput = document.getElementById('userAge');
    const genderSelect = document.getElementById('userGender');
    const tasteSelect = document.getElementById('userTastePreference');
    
    const oldAge = userProfile.age;
    const oldGender = userProfile.gender;
    
    userProfile = {
        age: ageInput ? ageInput.value : '',
        gender: genderSelect ? genderSelect.value : '',
        tastePreference: tasteSelect ? tasteSelect.value : ''
    };
    
    // 如果用户刚填写了年龄和性别，且之前没有填写，自动触发生成方案
    if (currentConstitution && currentConstitution.type) {
        const age = parseInt(userProfile.age);
        const gender = userProfile.gender;
        
        // 之前没有完整信息，现在有了，自动生成
        if ((!oldAge || !oldGender) && age && gender && age >= 1 && age <= 120) {
            // 延迟一下，避免频繁触发
            setTimeout(() => {
                tryGetPersonalizedPlan(currentConstitution.type);
            }, 500);
        }
    }
}

// 手动触发生成个性化方案（供按钮调用）
window.generatePersonalizedPlan = async function() {
    if (!currentConstitution || !currentConstitution.type) {
        addMessageToChat('ai', '请先选择您的体质类型，或者<a href="#test" class="text-ochre hover:underline">完成体质测试</a>。');
        return;
    }

    await tryGetPersonalizedPlan(currentConstitution.type);
}

// 初始化AI模块（在显示测试结果时调用）
window.initAIConsultation = async function(constitutionData) {
    currentConstitution = constitutionData;
    
    // 重置对话历史
    conversationHistory = [];
    
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

    // 自动获取个性化方案（如果用户填写了年龄和性别）
    await tryGetPersonalizedPlan(constitutionData.type);
}

// 尝试获取个性化方案
async function tryGetPersonalizedPlan(constitutionType) {
    // 检查服务是否可用
    if (!window.tcmService || !window.tcmService.apiKey) {
        console.log('ℹ️ DeepSeek API 未配置，跳过个性化方案生成');
        return;
    }

    // 获取用户信息
    updateUserProfile();
    const age = parseInt(userProfile.age);
    const gender = userProfile.gender;

    // 如果用户没有填写年龄和性别，不自动调用
    if (!age || !gender) {
        console.log('ℹ️ 用户未填写年龄或性别，跳过个性化方案生成');
        // 添加提示消息
        const chatBox = document.getElementById('aiChatBox');
        if (chatBox) {
            addMessageToChat('ai', '💡 <strong>提示：</strong>填写您的年龄和性别后，我可以为您生成更精准的个性化养生方案！');
        }
        return;
    }

    // 验证年龄范围
    if (age < 1 || age > 120) {
        console.warn('⚠️ 年龄超出有效范围');
        return;
    }

    try {
        console.log('🤖 正在生成个性化养生方案...');
        
        // 显示加载提示
        const loadingId = addMessageToChat('ai', '<span class="ai-typing">正在为您生成个性化养生方案，请稍候...</span>');

        const startTime = Date.now();
        
        // 调用服务获取个性化方案
        const plan = await window.tcmService.getPersonalizedPlan(age, gender, constitutionType);
        
        const duration = Date.now() - startTime;
        console.log(`✅ 个性化方案生成完成，耗时：${duration}ms`);

        // 移除加载提示
        removeMessage(loadingId);

        // 显示个性化方案
        displayPersonalizedPlan(plan, duration);

    } catch (error) {
        console.error('❌ 生成个性化方案失败:', error);
        
        // 移除加载提示
        const loadingMessages = document.querySelectorAll('.ai-typing');
        loadingMessages.forEach(msg => {
            const msgDiv = msg.closest('.flex');
            if (msgDiv) msgDiv.remove();
        });

        // 显示错误提示
        addMessageToChat('ai', `抱歉，生成个性化方案时出现错误：${error.message}。您可以继续通过提问的方式获取建议。`);
    }
}

// 显示个性化方案
function displayPersonalizedPlan(plan, duration) {
    const chatBox = document.getElementById('aiChatBox');
    if (!chatBox) return;

    // 构建方案HTML
    let planHtml = `
        <div class="bg-gradient-to-br from-ochre/10 to-warm/10 rounded-xl p-4 border border-ochre/20 mb-3">
            <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">✨</span>
                <h4 class="font-medium text-ink">您的个性化养生方案</h4>
                <span class="text-xs text-indigo/60 ml-auto">生成耗时：${duration}ms</span>
            </div>
            
            <div class="space-y-4 text-sm">
                <!-- 体质分析 -->
                <div>
                    <h5 class="font-medium text-ink mb-2 flex items-center gap-2">
                        <span>📊</span> 体质分析
                    </h5>
                    <p class="text-indigo/90 leading-relaxed">${plan.analysis || '—'}</p>
                </div>

                <!-- 饮食建议 -->
                ${plan.dietaryRecommendations && plan.dietaryRecommendations.length > 0 ? `
                <div>
                    <h5 class="font-medium text-ink mb-2 flex items-center gap-2">
                        <span>🍲</span> 饮食建议
                    </h5>
                    <ul class="space-y-1 text-indigo/90">
                        ${plan.dietaryRecommendations.map(rec => `<li class="flex items-start gap-2"><span class="text-ochre">•</span><span>${rec}</span></li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <!-- 生活方式建议 -->
                ${plan.lifestyleRecommendations && plan.lifestyleRecommendations.length > 0 ? `
                <div>
                    <h5 class="font-medium text-ink mb-2 flex items-center gap-2">
                        <span>🏠</span> 生活方式建议
                    </h5>
                    <ul class="space-y-1 text-indigo/90">
                        ${plan.lifestyleRecommendations.map(rec => `<li class="flex items-start gap-2"><span class="text-ochre">•</span><span>${rec}</span></li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <!-- 运动建议 -->
                ${plan.exerciseRecommendations && plan.exerciseRecommendations.length > 0 ? `
                <div>
                    <h5 class="font-medium text-ink mb-2 flex items-center gap-2">
                        <span>🏃</span> 运动建议
                    </h5>
                    <ul class="space-y-1 text-indigo/90">
                        ${plan.exerciseRecommendations.map(rec => `<li class="flex items-start gap-2"><span class="text-ochre">•</span><span>${rec}</span></li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <!-- 穴位推荐 -->
                ${plan.acupointRecommendations && plan.acupointRecommendations.length > 0 ? `
                <div>
                    <h5 class="font-medium text-ink mb-2 flex items-center gap-2">
                        <span>👆</span> 穴位推荐
                    </h5>
                    <div class="space-y-2">
                        ${plan.acupointRecommendations.map(acupoint => `
                            <div class="bg-white/60 rounded-lg p-3 border border-ochre/10">
                                <div class="font-medium text-ink mb-1">${acupoint.name || '—'}</div>
                                <div class="text-xs text-indigo/80 space-y-1">
                                    ${acupoint.location ? `<div><strong>位置：</strong>${acupoint.location}</div>` : ''}
                                    ${acupoint.function ? `<div><strong>功效：</strong>${acupoint.function}</div>` : ''}
                                    ${acupoint.method ? `<div><strong>方法：</strong>${acupoint.method}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- 四季调养 -->
                ${plan.seasonalAdjustments ? `
                <div>
                    <h5 class="font-medium text-ink mb-2 flex items-center gap-2">
                        <span>🌸</span> 四季调养要点
                    </h5>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        ${plan.seasonalAdjustments.spring ? `<div class="bg-white/60 rounded p-2"><strong class="text-ochre">春：</strong>${plan.seasonalAdjustments.spring}</div>` : ''}
                        ${plan.seasonalAdjustments.summer ? `<div class="bg-white/60 rounded p-2"><strong class="text-ochre">夏：</strong>${plan.seasonalAdjustments.summer}</div>` : ''}
                        ${plan.seasonalAdjustments.autumn ? `<div class="bg-white/60 rounded p-2"><strong class="text-ochre">秋：</strong>${plan.seasonalAdjustments.autumn}</div>` : ''}
                        ${plan.seasonalAdjustments.winter ? `<div class="bg-white/60 rounded p-2"><strong class="text-ochre">冬：</strong>${plan.seasonalAdjustments.winter}</div>` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- 年龄专项建议 -->
                ${plan.ageSpecificAdvice ? `
                <div class="bg-ochre/5 rounded-lg p-3 border border-ochre/20">
                    <h5 class="font-medium text-ink mb-2 flex items-center gap-2">
                        <span>🎯</span> 年龄专项建议
                    </h5>
                    <p class="text-indigo/90 text-sm">${plan.ageSpecificAdvice}</p>
                </div>
                ` : ''}

                <!-- 注意事项 -->
                ${plan.warnings && plan.warnings.length > 0 ? `
                <div class="bg-red-50 rounded-lg p-3 border border-red-200">
                    <h5 class="font-medium text-red-800 mb-2 flex items-center gap-2">
                        <span>⚠️</span> 注意事项
                    </h5>
                    <ul class="space-y-1 text-red-700 text-sm">
                        ${plan.warnings.map(warning => `<li class="flex items-start gap-2"><span>•</span><span>${warning}</span></li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>

            <div class="mt-3 pt-3 border-t border-ochre/20 text-xs text-indigo/60 text-center">
                💡 以上方案基于您的年龄、性别和体质类型生成，仅供参考。具体调理请咨询专业中医师。
            </div>
        </div>
    `;

    // 添加到聊天框
    addMessageToChat('ai', planHtml);
}

// 调用真实AI API
async function callAIAPI(userMessage) {
    try {
        // 构建个人信息描述
        let profileInfo = '';
        if (userProfile.age || userProfile.gender || userProfile.tastePreference) {
            profileInfo = '\n\n用户个人信息：';
            if (userProfile.age) profileInfo += `\n- 年龄：${userProfile.age}岁`;
            if (userProfile.gender) {
                const genderText = userProfile.gender === 'male' ? '男性' : '女性';
                profileInfo += `\n- 性别：${genderText}`;
            }
            if (userProfile.tastePreference) {
                const tasteMap = {
                    'light': '清淡口味',
                    'spicy': '偏辣口味',
                    'sweet': '偏甜口味',
                    'salty': '偏咸口味',
                    'sour': '偏酸口味'
                };
                profileInfo += `\n- 口味偏好：${tasteMap[userProfile.tastePreference]}`;
            }
        }
        
        // 构建系统提示词
        const systemPrompt = `你是一位专业的中医养生顾问，精通中医体质理论和养生调理方法。

当前用户的体质信息：
- 体质类型：${currentConstitution.type}
- 体质描述：${currentConstitution.description}
- 体质特征：${currentConstitution.features}
- 调理原则：${currentConstitution.principle}
- 推荐食物：${currentConstitution.foods}
- 饮食建议：${currentConstitution.dietRecommend}${profileInfo}

请基于以上体质信息和用户个人信息，为用户提供专业、实用的中医养生建议。回答要求：
1. 语言通俗易懂，避免过于专业的术语
2. 建议具体可行，贴近日常生活
3. 如果用户提供了年龄、性别或口味偏好，请在建议中考虑这些因素
4. 针对不同年龄段给出适合的建议（如老年人、中年人、青年人）
5. 针对不同性别给出针对性建议（如女性经期调理、男性养生等）
6. 根据口味偏好推荐合适的食材和烹饪方法
7. 注重安全性，提醒用户必要时咨询专业医师
8. 回答简洁明了，重点突出
9. 可以适当使用emoji增加亲和力`;

        // 构建消息历史
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage }
        ];

        // 调用API
        const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: messages,
                max_tokens: AI_CONFIG.maxTokens,
                temperature: AI_CONFIG.temperature,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('API返回数据格式错误');
        }

        const aiResponse = data.choices[0].message.content;

        // 保存对话历史（限制历史长度，避免token过多）
        conversationHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: aiResponse }
        );

        // 只保留最近10轮对话
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        return aiResponse;

    } catch (error) {
        console.error('AI API调用失败:', error);
        
        // 返回友好的错误提示和降级方案
        return `抱歉，AI服务暂时无法响应（${error.message}）。<br/><br/>
                作为备选，这里是一些基于您的<strong>${currentConstitution.type}</strong>的基本建议：<br/><br/>
                ${getFallbackResponse(userMessage)}`;
    }
}

// 降级响应（当API失败时使用本地知识库）
function getFallbackResponse(question) {
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
    
    // 默认综合回答
    return `<strong>关于${type}的建议：</strong><br/><br/>
            <strong>🥗 饮食：</strong>${kb.diet}<br/><br/>
            <strong>🏃 运动：</strong>${kb.exercise}<br/><br/>
            <strong>💡 生活：</strong>${kb.lifestyle}`;
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
    const thinkingId = addMessageToChat('ai', '<span class="ai-typing">AI正在思考中...</span>');
    
    try {
        // 调用真实AI API
        const response = await callAIAPI(question);
        
        // 移除"正在思考"消息
        removeMessage(thinkingId);
        
        // 显示AI回复
        addMessageToChat('ai', response);
        
    } catch (error) {
        console.error('AI响应失败:', error);
        removeMessage(thinkingId);
        addMessageToChat('ai', '抱歉，AI服务暂时无法响应，请稍后再试。');
    }
}

// 添加消息到聊天框
function addMessageToChat(sender, content) {
    const chatBox = document.getElementById('aiChatBox');
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = 'flex gap-3 animate-fadeInUp';
    
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
                <div class="text-sm text-ink">${content}</div>
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

// 导出函数供其他模块使用
window.AIConsultation = {
    init: initAIConsultation,
    ask: askAI,
    selectConstitution: selectConstitution
};

