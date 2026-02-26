// doctor-chat.js - 医生在线咨询功能
// 注意：避免使用"诊断"、"治疗"、"处方"等绝对化医疗用语

// 聊天窗口状态
let doctorChatOpen = false;

// 切换聊天窗口显示/隐藏
window.toggleDoctorChat = function() {
    const chatWindow = document.getElementById('doctorChatWindow');
    const chatButton = document.getElementById('doctorChatButton');
    
    doctorChatOpen = !doctorChatOpen;
    
    if (doctorChatOpen) {
        chatWindow.classList.add('open');
        chatButton.style.display = 'none';
        // 聚焦输入框
        setTimeout(() => {
            const input = document.getElementById('doctorChatInput');
            if (input) input.focus();
        }, 100);
    } else {
        chatWindow.classList.remove('open');
        chatButton.style.display = 'flex';
    }
}

// 发送消息
window.sendDoctorMessage = async function() {
    const input = document.getElementById('doctorChatInput');
    const message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // 检查是否包含违规词汇
    const forbiddenWords = ['诊断', '治疗', '处方', '开药', '确诊', '治愈', '根治'];
    const hasForbiddenWord = forbiddenWords.some(word => message.includes(word));
    
    if (hasForbiddenWord) {
        addDoctorMessage('doctor', '感谢您的提问。为了确保咨询的合规性，建议您使用更温和的表述，比如"咨询"、"了解"、"建议"等。我可以为您提供健康方面的参考建议和知识分享。');
        input.value = '';
        return;
    }
    
    // 显示用户消息
    addDoctorMessage('user', message);
    input.value = '';
    
    // 显示医生正在输入
    const typingId = showDoctorTyping();
    
    // 模拟医生回复（延迟1-2秒）
    setTimeout(() => {
        hideDoctorTyping(typingId);
        const response = generateDoctorResponse(message);
        addDoctorMessage('doctor', response);
    }, 1000 + Math.random() * 1000);
}

// 添加消息到聊天框
function addDoctorMessage(sender, content) {
    const messagesContainer = document.getElementById('doctorChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `doctor-message ${sender}`;
    
    const avatar = sender === 'user' ? '👤' : '👨‍⚕️';
    
    messageDiv.innerHTML = `
        <div class="doctor-message-avatar">${avatar}</div>
        <div class="doctor-message-content">
            <p>${content}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 显示医生正在输入
function showDoctorTyping() {
    const messagesContainer = document.getElementById('doctorChatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'doctor-typing-indicator';
    typingDiv.className = 'doctor-message doctor';
    
    typingDiv.innerHTML = `
        <div class="doctor-message-avatar">👨‍⚕️</div>
        <div class="doctor-message-content">
            <div class="doctor-typing-indicator">
                <div class="doctor-typing-dot"></div>
                <div class="doctor-typing-dot"></div>
                <div class="doctor-typing-dot"></div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return 'doctor-typing-indicator';
}

// 隐藏正在输入指示器
function hideDoctorTyping(typingId) {
    const typingElement = document.getElementById(typingId);
    if (typingElement) {
        typingElement.remove();
    }
}

// 生成医生回复（基于合规的知识库）
function generateDoctorResponse(question) {
    const q = question.toLowerCase();
    
    // 合规回复模板 - 使用"建议"、"参考"、"咨询"等温和词汇
    const responses = {
        // 体质相关
        '体质': '关于体质方面，我建议您先完成我们的体质测试，了解自己的体质类型。根据不同的体质，我们可以提供相应的<strong>饮食建议</strong>和<strong>生活调理参考</strong>。如需更详细的咨询，建议您咨询专业的中医师。',
        
        // 症状相关 - 避免诊断
        '症状': '我理解您的关注。需要说明的是，我无法进行医疗诊断。如果您有身体不适，建议您：<br/>1. 及时到正规医疗机构就诊<br/>2. 咨询专业医师<br/>3. 我可以为您提供一些<strong>健康知识参考</strong>和<strong>日常调理建议</strong>，但这不能替代专业医疗咨询。',
        
        // 饮食相关
        '吃什么': '关于饮食方面，我建议：<br/>1. 根据您的体质类型选择适合的食物<br/>2. 保持饮食均衡，多样化摄入<br/>3. 避免过度偏食<br/>如果您已完成体质测试，我可以为您提供更具体的<strong>饮食参考建议</strong>。',
        
        '水果': '关于水果的选择，建议：<br/>1. 根据自身体质选择适合的水果类型<br/>2. 适量食用，不要过量<br/>3. 注意水果的性味（温性、寒性等）<br/>如果您想了解具体适合的水果，建议先完成体质测试，我可以为您提供更个性化的参考建议。',
        
        // 运动相关
        '运动': '关于运动方面，我建议：<br/>1. 选择适合自己体质的运动方式<br/>2. 循序渐进，量力而行<br/>3. 保持规律，持之以恒<br/>4. 注意运动时的身体反应<br/>如果您想了解具体的运动建议，可以先完成体质测试，我可以为您提供更个性化的参考方案。',
        
        // 调理相关 - 避免治疗
        '调理': '关于身体调理，我建议：<br/>1. 从饮食、运动、作息等多方面入手<br/>2. 根据自身体质特点进行个性化调理<br/>3. 保持心情愉悦，规律作息<br/>4. 如有需要，建议咨询专业中医师获得更详细的<strong>调理方案参考</strong><br/><br/>💡 温馨提示：调理是一个长期过程，需要耐心坚持。',
        
        '改善': '关于改善身体状况，我建议：<br/>1. 了解自己的体质特点<br/>2. 调整饮食结构，选择适合的食物<br/>3. 适当运动，增强体质<br/>4. 保持良好作息和心情<br/>5. 如有需要，建议咨询专业医师获得更详细的<strong>建议和指导</strong>。',
        
        // 食疗相关
        '食疗': '关于食疗方面，我建议：<br/>1. 根据自身体质选择适合的食材<br/>2. 注意食材的性味和搭配<br/>3. 坚持长期调理，不要急于求成<br/>4. 如有需要，建议咨询专业中医师获得更详细的<strong>食疗方案参考</strong><br/><br/>💡 温馨提示：食疗是辅助调理方式，不能替代专业医疗。',
        
        // 睡眠相关
        '睡眠': '关于睡眠方面，我建议：<br/>1. 保持规律作息，早睡早起<br/>2. 创造良好的睡眠环境<br/>3. 睡前避免过度兴奋或进食<br/>4. 适当运动有助于改善睡眠<br/>5. 如有严重睡眠问题，建议咨询专业医师。',
        
        // 疲劳相关
        '疲劳': '关于疲劳问题，我建议：<br/>1. 保证充足睡眠和休息<br/>2. 适当运动，增强体质<br/>3. 注意营养均衡<br/>4. 保持心情愉悦<br/>5. 如果疲劳持续或加重，建议及时就医咨询，排除其他健康问题。',
        
        // 疼痛相关 - 避免诊断
        '疼': '关于疼痛问题，我理解您的困扰。需要说明的是，我无法进行医疗诊断。建议您：<br/>1. 如果疼痛持续或加重，请及时就医<br/>2. 咨询专业医师，获得专业的医疗建议<br/>3. 我可以为您提供一些<strong>日常保健知识参考</strong>，但这不能替代专业医疗咨询。',
        
        // 感冒相关
        '感冒': '关于感冒问题，我建议：<br/>1. 多休息，保证充足睡眠<br/>2. 多喝水，保持身体水分<br/>3. 注意保暖，避免受凉<br/>4. 饮食清淡，易于消化<br/>5. 如果症状严重或持续，建议及时就医咨询。',
        
        // 默认回复
        'default': '感谢您的提问。我可以为您提供健康方面的<strong>咨询和参考建议</strong>，包括：<br/>• 体质相关的知识分享<br/>• 饮食调理的参考建议<br/>• 运动养生的指导<br/>• 日常保健的知识<br/><br/>💡 温馨提示：<br/>1. 本平台仅提供健康咨询和参考建议<br/>2. 不能替代专业医疗诊断和治疗<br/>3. 如有身体不适，请及时就医<br/>4. 建议您先完成体质测试，我可以为您提供更个性化的建议<br/><br/>您还有什么其他问题吗？'
    };
    
    // 关键词匹配
    if (q.includes('体质') || q.includes('类型')) {
        return responses['体质'];
    }
    
    if (q.includes('症状') || q.includes('表现') || q.includes('不舒服')) {
        return responses['症状'];
    }
    
    if (q.includes('吃什么') || q.includes('食物') || q.includes('饮食')) {
        return responses['吃什么'];
    }
    
    if (q.includes('水果')) {
        return responses['水果'];
    }
    
    if (q.includes('运动') || q.includes('锻炼') || q.includes('健身')) {
        return responses['运动'];
    }
    
    if (q.includes('调理') || q.includes('调养')) {
        return responses['调理'];
    }
    
    if (q.includes('改善') || q.includes('改变')) {
        return responses['改善'];
    }
    
    if (q.includes('食疗') || q.includes('食补')) {
        return responses['食疗'];
    }
    
    if (q.includes('睡眠') || q.includes('睡觉') || q.includes('失眠')) {
        return responses['睡眠'];
    }
    
    if (q.includes('疲劳') || q.includes('累') || q.includes('乏力')) {
        return responses['疲劳'];
    }
    
    if (q.includes('疼') || q.includes('痛')) {
        return responses['疼'];
    }
    
    if (q.includes('感冒') || q.includes('发烧')) {
        return responses['感冒'];
    }
    
    // 返回默认回复
    return responses['default'];
}

// 初始化医生聊天功能
document.addEventListener('DOMContentLoaded', function() {
    // 可以在这里添加初始化逻辑
    console.log('医生咨询功能已加载');
});


