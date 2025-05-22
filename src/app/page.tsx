"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/components/AuthContext";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function Home() {
  const { isAuthenticated, isLoading, login, logout, userData } = useAuth();
  const { isConnected, address } = useAccount();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setLoginError(null);
      setIsLoggingIn(true);
      await login();
    } catch (error) {
      console.error("登录错误:", error);
      setLoginError(
        error instanceof Error ? error.message : "登录失败，请重试"
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setLoginError(null);
    logout();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-100 to-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Web3 安全认证
        </h1>

        <div className="flex justify-center mb-6">
          <ConnectButton />
        </div>

        {/* 错误提示 */}
        {loginError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{loginError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">正在验证身份...</p>
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  已安全登录
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    钱包地址:
                  </span>
                  <p className="text-sm text-gray-900 font-mono mt-1 break-all">
                    {userData?.address}
                  </p>
                </div>

                {userData?.exp && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      登录有效期:
                    </span>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(userData.exp * 1000).toLocaleString("zh-CN")}
                    </p>
                  </div>
                )}

                {userData?.iat && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      登录时间:
                    </span>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(userData.iat * 1000).toLocaleString("zh-CN")}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                安全登出
              </button>
            </div>
          ) : isConnected ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  钱包已连接
                </div>
              </div>

              <div className="text-center text-gray-600 mb-4">
                <p className="text-sm">当前地址:</p>
                <p className="font-mono text-xs mt-1 break-all">{address}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      点击下方按钮进行安全签名验证，此操作不会产生任何gas费用。
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    正在验证签名...
                  </div>
                ) : (
                  "开始安全验证"
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">请先连接您的钱包</p>
              <p className="text-gray-500 text-sm mt-2">
                支持 MetaMask、WalletConnect 等主流钱包
              </p>
            </div>
          )}
        </div>

        {/* 添加安全说明 */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🔒 采用地址绑定nonce技术，确保登录安全</p>
          <p>⚡ 签名验证，无需支付gas费用</p>
          <p>🛡️ 您的私钥始终安全存储在钱包中</p>
        </div>
      </div>
    </main>
  );
}
