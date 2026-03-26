"use client";

import VConsole from "vconsole";
import { useEffect } from "react";

/**
 * vConsole 组件 - 移动端调试工具
 * 只在开发环境或通过环境变量启用
 */
export function VConsoleInstance() {
  useEffect(() => {
    // 只在客户端运行
    if (typeof window === "undefined") return;

    const vConsoleInstance = new VConsole();

    // call `console` methods as usual
    console.log("Hello world");

    return () => {
      vConsoleInstance.destroy();
    };
  }, []);

  // 这个组件不渲染任何内容
  return null;
}
