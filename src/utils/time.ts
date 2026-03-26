export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 计算从指定时间到当前时间的天数差
 * @param dateString 日期字符串（ISO 格式或其他标准格式）
 * @returns 天数差（整数）
 */
export const getDaysAgo = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
