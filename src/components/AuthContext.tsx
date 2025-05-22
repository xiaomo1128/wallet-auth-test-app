"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Define a type for decoded JWT data
interface DecodedToken {
  sub: string;
  address: string;
  exp: number;
  iat?: number;
  [key: string]: unknown;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: () => Promise<void>;
  logout: () => void;
  userData: DecodedToken | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  login: async () => {},
  logout: () => {},
  userData: null,
});

// 配置后端API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<DecodedToken | null>(null);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // 检查本地存储的token
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken) as DecodedToken;
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp > currentTime) {
          setToken(storedToken);
          setIsAuthenticated(true);
          setUserData(decoded);
          console.log("从本地存储恢复认证状态:", decoded.address);
        } else {
          // Token过期
          console.log("Token已过期，清除本地存储");
          localStorage.removeItem("authToken");
        }
      } catch (err) {
        // Handle error properly
        console.error("解码token失败:", err);
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false);
  }, []);

  // 监听账户变化，如果切换账户则自动登出
  useEffect(() => {
    if (
      isAuthenticated &&
      userData &&
      address &&
      userData.address.toLowerCase() !== address.toLowerCase()
    ) {
      console.log("检测到账户切换，自动登出");
      logout();
    }
  }, [address, isAuthenticated, userData]);

  // 修改：从后端获取与地址绑定的nonce
  const fetchNonce = async (userAddress: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/nonce`, {
        params: { address: userAddress },
        timeout: 10000, // 10秒超时
      });

      console.log("获取nonce响应:", response.data);
      return response.data.nonce;
    } catch (error) {
      console.error("获取nonce失败:", error);
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED") {
          throw new Error("无法连接到后端服务，请检查服务是否启动");
        }
        if (error.response?.status === 429) {
          throw new Error("请求过于频繁，请稍后重试");
        }
      }
      throw new Error("获取nonce失败，请重试");
    }
  };

  // 改进：创建更安全的签名消息
  const createSecureSignMessage = async (userAddress: string) => {
    const nonce = await fetchNonce(userAddress);
    const domain = window.location.host;
    const timestamp = new Date().toISOString();

    // 创建包含更多安全信息的消息
    const message = `Welcome to ${domain}!

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will be securely verified.

Wallet address: ${userAddress}
Timestamp: ${timestamp}
Nonce: ${nonce}

Click "Sign" to authenticate.`;

    console.log("创建的安全消息:", message);
    return message;
  };

  // 改进的登录方法
  const login = async () => {
    if (!isConnected || !address) {
      throw new Error("请先连接钱包");
    }

    try {
      setIsLoading(true);
      console.log("开始登录流程，地址:", address);

      // 规范化地址格式
      const normalizedAddress = address.toLowerCase();

      // 获取与地址绑定的nonce并创建消息
      const message = await createSecureSignMessage(normalizedAddress);

      console.log("请求用户签名...");
      // 请求用户签名
      const signature = await signMessageAsync({
        message,
        account: address, // 明确指定签名账户
      });

      console.log("获取的签名:", signature);

      // 创建请求体
      const requestBody = {
        message,
        signature,
        address: normalizedAddress,
      };

      console.log("发送验证请求到后端...");

      // 发送到后端验证
      const response = await axios.post(
        `${API_BASE_URL}/auth/simple-verify`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10秒超时
        }
      );

      console.log("验证成功:", response.data);

      const { token } = response.data;
      if (!token) {
        throw new Error("服务器未返回有效token");
      }

      // 验证token格式
      const decoded = jwtDecode(token) as DecodedToken;
      if (decoded.address.toLowerCase() !== normalizedAddress) {
        throw new Error("返回的token地址不匹配");
      }

      // 存储认证信息
      localStorage.setItem("authToken", token);
      setToken(token);
      setIsAuthenticated(true);
      setUserData(decoded);

      console.log("登录成功完成");
    } catch (error: unknown) {
      console.error("登录失败:", error);

      // 提供更友好的错误信息
      let errorMessage = "登录失败，请重试";

      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          errorMessage = "用户取消了签名";
        } else if (error.message.includes("连接")) {
          errorMessage = "网络连接失败，请检查网络或后端服务";
        } else if (error.message.includes("nonce")) {
          errorMessage = "验证码获取失败，请重试";
        } else {
          errorMessage = error.message;
        }
      } else if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = "签名验证失败，请重新尝试";
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.message || "请求参数错误";
        } else if (error.response && error.response.status >= 500) {
          errorMessage = "服务器错误，请稍后重试";
        }
      }

      // 抛出带有友好消息的错误
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 改进的登出方法
  const logout = () => {
    console.log("用户登出");
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    setToken(null);
    setUserData(null);

    // 可选：如果需要完全断开钱包连接
    // disconnect();
  };

  // 添加token自动刷新机制（可选）
  useEffect(() => {
    if (isAuthenticated && userData) {
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = userData.exp - currentTime;

      // 如果token在5分钟内过期，显示警告
      if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
        console.warn("Token即将过期，建议重新登录");
      }

      // 如果token已过期，自动登出
      if (timeUntilExpiry <= 0) {
        console.log("Token已过期，自动登出");
        logout();
      }
    }
  }, [isAuthenticated, userData]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        login,
        logout,
        userData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
