// 截取字符串，前面保留 n 个字符，后面保留 m 个字符，中间用 ... 代替
export const truncateString = (str: string, n: number, m: number) => {
  if (str.length <= n + m) {
    return str;
  }
  return `${str.slice(0, n)}...${str.slice(-m)}`;
};
