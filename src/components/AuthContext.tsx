"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Define a type for decoded JWT data
interface DecodedToken {
  exp: number;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<DecodedToken | null>(null);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

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
        } else {
          // Token过期
          localStorage.removeItem("authToken");
        }
      } catch (err) {
        // Handle error properly
        console.error("Failed to decode token:", err);
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false);
  }, []);

  // 从后端获取nonce
  const fetchNonce = async () => {
    const response = await axios.get("http://localhost:3001/auth/nonce");
    return response.data.nonce;
  };

  // 完全自定义的消息创建函数
  const createSimpleSignMessage = async (address: string) => {
    const nonce = await fetchNonce();
    const domain = window.location.host;

    // 创建简单的、格式统一的消息
    const message = `Sign this message to authenticate with ${domain}.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

    console.log("创建的简单消息:", message);
    return message;
  };

  // 登录方法
  const login = async () => {
    if (!isConnected || !address) return;

    try {
      setIsLoading(true);
      // 使用自定义消息函数
      const message = await createSimpleSignMessage(address);

      // 请求用户签名
      const signature = await signMessageAsync({ message });
      console.log("获取的签名:", signature);

      // 确保地址格式统一
      const normalizedAddress = address.toLowerCase();
      console.log("规范化的地址:", normalizedAddress);

      // 创建请求体
      const requestBody = {
        message,
        signature,
        address: normalizedAddress,
      };

      console.log("发送到后端的数据:", JSON.stringify(requestBody, null, 2));

      // 发送到后端验证
      const response = await axios.post(
        "http://localhost:3001/auth/simple-verify", // 使用新路由
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("验证响应:", response.data);

      const { token } = response.data;
      localStorage.setItem("authToken", token);

      setToken(token);
      setIsAuthenticated(true);
      setUserData(jwtDecode(token) as DecodedToken);
    } catch (error: unknown) {
      console.error("登录失败", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("服务器返回错误:", {
          status: error.response.status,
          data: error.response.data,
        });
      }
      throw error; // 重新抛出以便外层catch处理
    } finally {
      setIsLoading(false);
    }
  };

  // 登出方法
  const logout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    setToken(null);
    setUserData(null);
    disconnect();
  };

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
