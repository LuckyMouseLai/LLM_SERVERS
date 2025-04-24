/**
 * 会议预订工作流的状态
 */
export type MeetingWorkflowState = 'COLLECTING_PARAMETERS' | 'CONFIRMING' | 'COMPLETED' | 'CANCELLED';

/**
 * 会议预订所需的参数
 */
export interface MeetingParameters {
    attendees?: string[]; // 参与者邮箱或名称
    date?: string;        // 日期 (YYYY-MM-DD)
    time?: string;        // 时间 (HH:MM)
    duration?: string;    // 时长 (例如 "30 minutes", "1 hour")
    topic?: string;       // 会议主题 (可选)
}

/**
 * 工作流处理用户输入的返回结果
 */
export interface WorkflowResponse {
    prompt?: string; // 需要向用户展示的下一个提示或问题
    isCompleted: boolean; // 工作流是否完成
    result?: MeetingParameters | null; // 如果完成，返回收集到的参数或null (如果取消)
    error?: string; // 如果处理中发生错误
} 