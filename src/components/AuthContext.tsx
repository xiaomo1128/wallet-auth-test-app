"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { SiweMessage } from "siwe";
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

  // 创建并签名SIWE消息
  const createSiweMessage = async (address: string, statement: string) => {
    const domain = window.location.host;
    const origin = window.location.origin;

    const message = new SiweMessage({
      domain,
      address,
      statement,
      uri: origin,
      version: "1",
      chainId: 1, // 根据您的需求更改
      nonce: await fetchNonce(),
    });

    return message.prepareMessage();
  };

  // 从后端获取nonce
  const fetchNonce = async () => {
    const response = await axios.get("http://localhost:3001/auth/nonce");
    return response.data.nonce;
  };

  // 登录方法
  const login = async () => {
    if (!isConnected || !address) return;

    try {
      setIsLoading(true);
      const message = await createSiweMessage(address, "登录Web3应用程序");

      const signature = await signMessageAsync({ message });

      // 向后端验证签名
      const response = await axios.post("http://localhost:3001/auth/verify", {
        message,
        signature,
        address,
      });

      const { token } = response.data;
      localStorage.setItem("authToken", token);

      setToken(token);
      setIsAuthenticated(true);
      setUserData(jwtDecode(token) as DecodedToken);
    } catch (error: unknown) {
      console.error("登录失败", error);
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
