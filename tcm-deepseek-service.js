/**
 * TCMDeepSeekService - 中医体质辨识与养生方案服务（前端版本）
 * 基于 DeepSeek API 实现个性化养生建议生成
 */

class TCMDeepSeekService {
  constructor() {
    // API 配置（从环境变量或配置中读取）
    this.apiKey = window.DEEPSEEK_API_KEY || '';
    this.baseURL = 'https://api.deepseek.com/v1';
    this.model = 'deepseek-chat';
    this.temperature = 0.6; // 平衡创造性与医学准确性
    this.timeout = 30000; // 30秒超时

    if (!this.apiKey) {
      console.warn('⚠️ DEEPSEEK_API_KEY 未配置，个性化方案功能将不可用');
    } else {
      console.log('✅ TCMDeepSeekService 初始化成功，API Key 已配置');
    }
  }

  /**
   * 生成系统 Prompt
   * 定义 AI 角色、九质理论标准、年龄性别修正权重
   */
  generateSystemPrompt() {
    return `你是一位专业的中医体质辨识与养生专家，精通《黄帝内经》《中医体质分类与判定》标准。

## 核心理论框架

### 九质理论标准
1. **平和质**：阴阳气血调和，体态适中，面色红润，精力充沛
2. **气虚质**：元气不足，疲乏无力，气短懒言，易出汗
3. **阳虚质**：阳气不足，畏寒怕冷，手足不温，喜热饮食
4. **阴虚质**：阴液亏少，手足心热，口燥咽干，喜冷饮
5. **痰湿质**：痰湿凝聚，体形肥胖，腹部松软，口黏腻
6. **湿热质**：湿热内蕴，面部油光，易生痤疮，口苦口臭
7. **血瘀质**：血行不畅，肤色晦暗，易有瘀斑，舌质紫暗
8. **气郁质**：气机郁滞，情绪低落，胸闷不舒，多愁善感
9. **特禀质**：先天禀赋异常，易过敏，遗传性疾病倾向

### 年龄与性别修正权重（女七男八生命周期理论）

#### 女性生命节点
- **7岁**：肾气盛，齿更发长
- **14岁**：天癸至，任脉通，月经初潮
- **21岁**：肾气平均，真牙生
- **28岁**：筋骨坚，发长极，身体最强
- **35岁**：阳明脉衰，面始焦，发始堕
- **42岁**：三阳脉衰于上，面皆焦，发始白
- **49岁**：任脉虚，太冲脉衰少，天癸竭，围绝经期

**围绝经期专项调理（45-52岁女性）**：
- 若用户为女性且年龄在 45-52 岁区间，需特别关注肝肾阴虚、心肾不交症状
- 自动加入疏肝滋肾、养心安神的专项建议
- 推荐食材：黑豆、桑葚、百合、酸枣仁、玫瑰花
- 推荐穴位：三阴交、太溪、神门、内关

#### 男性生命节点
- **8岁**：肾气实，发长齿更
- **16岁**：肾气盛，天癸至，精气溢泻
- **24岁**：肾气平均，筋骨劲强
- **32岁**：筋骨隆盛，肌肉满壮
- **40岁**：肾气衰，发堕齿槁
- **48岁**：阳气衰竭于上，面焦，发鬓颁白
- **56岁**：肝气衰，筋不能动
- **64岁**：天癸竭，精少，肾脏衰

**中年男性调理重点（40-56岁）**：
- 补肾固本，强筋健骨
- 预防心脑血管疾病
- 推荐食材：核桃、枸杞、山药、海参
- 推荐穴位：肾俞、命门、关元、足三里

### 输出要求
你必须严格按照以下 JSON 格式输出，不得包含任何其他文字说明：

{
  "constitution": "体质类型（九质之一）",
  "analysis": "体质分析（结合年龄、性别的综合评估，150-200字）",
  "dietaryRecommendations": [
    "饮食建议1（具体食材+功效）",
    "饮食建议2",
    "饮食建议3"
  ],
  "lifestyleRecommendations": [
    "生活方式建议1（具体可操作）",
    "生活方式建议2",
    "生活方式建议3"
  ],
  "exerciseRecommendations": [
    "运动建议1（适合该体质的运动类型+强度）",
    "运动建议2",
    "运动建议3"
  ],
  "acupointRecommendations": [
    {
      "name": "穴位名称",
      "location": "穴位位置描述",
      "function": "功效说明",
      "method": "按摩手法"
    }
  ],
  "seasonalAdjustments": {
    "spring": "春季调养要点",
    "summer": "夏季调养要点",
    "autumn": "秋季调养要点",
    "winter": "冬季调养要点"
  },
  "warnings": [
    "注意事项1",
    "注意事项2"
  ],
  "ageSpecificAdvice": "基于当前年龄段的专项建议（若处于关键生理节点需特别说明）"
}`;
  }

  /**
   * 构造用户消息
   */
  buildUserMessage(age, gender, constitution) {
    const genderText = gender === 'male' ? '男性' : '女性';
    
    let message = `请为以下用户生成个性化中医养生方案：

- 年龄：${age}岁
- 性别：${genderText}
- 体质类型：${constitution}`;

    // 特殊生理节点提示
    if (gender === 'female' && age >= 45 && age <= 52) {
      message += '\n\n【重要】该用户处于围绝经期关键阶段，请在方案中加入疏肝滋肾、养心安神的专项调理建议。';
    }

    if (gender === 'male' && age >= 40 && age <= 56) {
      message += '\n\n【重要】该用户处于中年肾气渐衰阶段，请在方案中加入补肾固本、强筋健骨的专项调理建议。';
    }

    return message;
  }

  /**
   * 参数验证
   */
  validateInput(age, gender, constitution) {
    if (age < 1 || age > 120) {
      throw new Error('年龄参数无效，应在 1-120 之间');
    }

    if (!['male', 'female'].includes(gender.toLowerCase())) {
      throw new Error('性别参数无效，应为 male 或 female');
    }

    const validConstitutions = [
      '平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质',
      '湿热质', '血瘀质', '气郁质', '特禀质'
    ];

    if (!validConstitutions.includes(constitution)) {
      throw new Error(`体质类型无效，应为九质之一：${validConstitutions.join('、')}`);
    }
  }

  /**
   * 解析并验证响应
   */
  parseAndValidateResponse(content) {
    try {
      // 尝试提取 JSON（可能包含 markdown 代码块）
      let jsonStr = content.trim();
      
      // 移除可能的 markdown 代码块标记
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonStr);

      // 验证必需字段
      const requiredFields = [
        'constitution',
        'analysis',
        'dietaryRecommendations',
        'lifestyleRecommendations',
        'exerciseRecommendations',
        'acupointRecommendations',
        'seasonalAdjustments',
        'warnings',
        'ageSpecificAdvice'
      ];

      for (const field of requiredFields) {
        if (!(field in parsed)) {
          console.warn(`响应缺少字段：${field}`);
        }
      }

      return parsed;

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`JSON 解析失败：${error.message}\n原始内容：${content.substring(0, 200)}...`);
      }
      throw error;
    }
  }

  /**
   * 获取个性化养生方案
   * @param {number} age - 年龄
   * @param {string} gender - 性别（'male' | 'female'）
   * @param {string} constitution - 体质类型（中文名称）
   * @returns {Promise<Object>} 结构化养生方案
   */
  async getPersonalizedPlan(age, gender, constitution) {
    // 检查 API Key
    if (!this.apiKey) {
      throw new Error('DeepSeek API Key 未配置');
    }

    try {
      // 参数验证
      this.validateInput(age, gender, constitution);

      // 构造用户消息
      const userMessage = this.buildUserMessage(age, gender, constitution);

      // 创建 AbortController 用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // 调用 DeepSeek API
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: this.generateSystemPrompt()
              },
              {
                role: 'user',
                content: userMessage
              }
            ],
            temperature: this.temperature,
            response_format: { type: 'json_object' }, // 强制 JSON 输出
            max_tokens: 2000
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          switch (response.status) {
            case 401:
              throw new Error('DeepSeek API Key 无效或已过期');
            case 429:
              throw new Error('DeepSeek API 请求频率超限，请稍后重试');
            case 500:
            case 502:
            case 503:
              throw new Error('DeepSeek 服务暂时不可用，请稍后重试');
            default:
              throw new Error(`DeepSeek API 错误 (${response.status})：${errorData?.error?.message || '未知错误'}`);
          }
        }

        const data = await response.json();

        // 提取并解析响应
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error('DeepSeek API 返回内容为空');
        }

        // 解析 JSON
        const parsedPlan = this.parseAndValidateResponse(content);
        
        return parsedPlan;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('DeepSeek API 请求超时，请稍后重试');
        }
        
        throw fetchError;
      }

    } catch (error) {
      console.error('TCMDeepSeekService 错误:', error);
      throw error;
    }
  }
}

// 导出单例实例
window.TCMDeepSeekService = TCMDeepSeekService;
window.tcmService = new TCMDeepSeekService();

