import { GradeLevel, Subject, KnowledgePoint } from './types';

export const GRADES = [GradeLevel.Seven, GradeLevel.Eight, GradeLevel.Nine];
export const SUBJECTS = [Subject.Math, Subject.Chinese, Subject.English, Subject.Physics, Subject.Chemistry];

export interface TopicDefinition {
  name: string;
  goal: string;
}

// Define the standard knowledge points (topics) and their learning goals for each subject
export const SUBJECT_TOPICS: Record<Subject, TopicDefinition[]> = {
  [Subject.Math]: [
    { name: '代数基础', goal: '熟练掌握整式加减乘除、幂的运算及因式分解' },
    { name: '平面几何', goal: '掌握全等、相似三角形判定及特殊四边形性质与证明' },
    { name: '函数图像', goal: '理解一次函数、二次函数性质并能解决实际应用问题' },
    { name: '数据统计', goal: '能计算平均数、方差，理解数据的离散程度与统计意义' },
    { name: '逻辑推理', goal: '掌握基础证明方法，严谨表述数学推理过程' }
  ],
  [Subject.English]: [
    { name: '词汇量', goal: '掌握课标要求的核心词汇拼写及在语境中的准确运用' },
    { name: '语法时态', goal: '准确运用一般过去时、现在完成时等基本时态及被动语态' },
    { name: '阅读理解', goal: '能理解主旨大意，推断隐含意义及分析文章结构' },
    { name: '写作表达', goal: '能运用丰富句式清晰、连贯地表达观点与叙事' },
    { name: '听力理解', goal: '能听懂日常对话关键信息及长对话细节含义' }
  ],
  [Subject.Chinese]: [
    { name: '古诗文默写', goal: '准确背诵并默写课标推荐的古诗文篇目，不写错别字' },
    { name: '文言文阅读', goal: '理解常见实词虚词含义，能翻译浅易文言文' },
    { name: '现代文阅读', goal: '概括文章中心，赏析语言特色及表现手法' },
    { name: '作文', goal: '能够写出中心明确、结构完整、语言通顺的记叙文或议论文' },
    { name: '基础知识', goal: '掌握字音字形、成语运用及病句修改' }
  ],
  [Subject.Physics]: [
    { name: '力学', goal: '掌握牛顿运动定律，能分析受力情况及简单机械原理' },
    { name: '光学', goal: '理解光的反射、折射规律及透镜成像原理' },
    { name: '电学', goal: '掌握欧姆定律，能进行串并联电路分析及电功率计算' },
    { name: '声学', goal: '了解声音产生传播条件及乐音三要素' },
    { name: '热学', goal: '理解物态变化吸放热及比热容概念' }
  ],
  [Subject.Chemistry]: [
    { name: '物质构成', goal: '理解分子、原子、离子概念及原子的核外电子排布' },
    { name: '化学方程式', goal: '正确书写化学方程式并进行基于质量守恒的计算' },
    { name: '酸碱盐', goal: '掌握常见酸碱盐的化学性质及复分解反应条件' },
    { name: '实验操作', goal: '掌握基本实验操作规范及气体制备收集方法' },
    { name: '金属', goal: '了解金属物理性质、化学性质及金属活动性顺序' }
  ],
};

// MOCK_DIAGNOSIS updated to match new structure
export const MOCK_DIAGNOSIS: Record<Subject, KnowledgePoint[]> = {
  [Subject.Math]: SUBJECT_TOPICS[Subject.Math].map(t => ({ name: t.name, score: 0, fullMark: 100, learningGoal: t.goal })),
  [Subject.English]: SUBJECT_TOPICS[Subject.English].map(t => ({ name: t.name, score: 0, fullMark: 100, learningGoal: t.goal })),
  [Subject.Chinese]: SUBJECT_TOPICS[Subject.Chinese].map(t => ({ name: t.name, score: 0, fullMark: 100, learningGoal: t.goal })),
  [Subject.Physics]: SUBJECT_TOPICS[Subject.Physics].map(t => ({ name: t.name, score: 0, fullMark: 100, learningGoal: t.goal })),
  [Subject.Chemistry]: SUBJECT_TOPICS[Subject.Chemistry].map(t => ({ name: t.name, score: 0, fullMark: 100, learningGoal: t.goal })),
};