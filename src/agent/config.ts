// 模型列表类型定义
enum ModelList {
    QWEN_PLUS = 'qwen-plus',
    QWEN_TURBO = 'qwen-turbo',
    QWEN_MAX = 'qwen-max',
    QWEN_7B = 'qwen2.5-7b-instruct',
    QWEN_14B = 'qwen2.5-14b-instruct',
    QWEN_32B = 'qwen2.5-32b-instruct',
    QWEN_72B = 'qwen2.5-72b-instruct',
    DOUBAO_LITE_4K = 'ep-20250331111923-gwf66',
    DOUBAO_LITE_32K = 'ep-20250331102334-g6gr7',
    DOUBAO_15_LITE_32K = 'ep-20250321180506-ld5jf',
    DOUBAO_15_PRO_32K = 'ep-20250321180541-q96sd',
  }
  
  // TTS 语音列表类型定义
  enum TTSList {
    邻家女孩 = "zh_female_linjianvhai_moon_bigtts",
    爽快思思 = "zh_female_shuangkuaisisi_emo_v2_mars_bigtts",
    湾湾小何 = "zh_female_wanwanxiaohe_moon_bigtts",
    阳光青年 = "zh_male_yangguangqingnian_emo_v2_mars_bigtts",
    甜美小源 = "zh_female_tianmeixiaoyuan_moon_bigtts",
    懒音绵宝 = "zh_male_lanxiaoyang_mars_bigtts",
  }
  // LLM 配置接口
  interface LLMConfigType {
    ASSISTANT_NAME: string;
    SYSTEM_PROMPT: string;
    MODEL: ModelList;
    MAX_HISTORY_LENGTH: number;
    TOOLS: any[];
  }
  
  interface AgentConfigType {
    LLMCONFIG: LLMConfigType;
    TOOLS: any[];
    CONTEXT: string;
    HANDOFFS: any[];
  }
  

  
  const LLMConfig: LLMConfigType = {
    ASSISTANT_NAME: "小天",
    SYSTEM_PROMPT: "你是智能家居助手,可以帮助用户解答问题。回复简短但完整。",
    MODEL: ModelList.QWEN_TURBO,
    MAX_HISTORY_LENGTH: 10, // 保存的历史消息数量上限
    TOOLS: ['get_current_time', 'get_weather']
  };
  
  const AgentConfig: AgentConfigType = {
    LLMCONFIG: LLMConfig,
    TOOLS: ['get_weather'],
    CONTEXT: "",
    HANDOFFS: []
}

  // 导出配置
  export {
    ModelList,
    LLMConfig,
    AgentConfig
  };
  
  export default {
    ModelList,
    LLMConfig,
    AgentConfig
  };
  