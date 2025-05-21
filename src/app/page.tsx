"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/components/AuthContext";
import { useAccount } from "wagmi";

export default function Home() {
  const { isAuthenticated, isLoading, login, logout, userData } = useAuth();
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-100 to-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Web3 认证演示
        </h1>

        <div className="flex justify-center mb-6">
          <ConnectButton />
        </div>

        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2">加载中...</p>
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-4">
              <div className="text-xl font-semibold text-green-600 text-center">
                已登录
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">地址:</span>{" "}
                  {userData?.address?.toString()}
                </p>
                {userData?.exp && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">过期时间:</span>{" "}
                    {new Date(userData.exp * 1000).toLocaleString()}
                  </p>
                )}
                {/* 显示更多用户数据 */}
              </div>
              <button
                onClick={logout}
                className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                登出
              </button>
            </div>
          ) : isConnected ? (
            <div className="space-y-4">
              <div className="text-xl font-semibold text-blue-600 text-center">
                已连接钱包
              </div>
              <p className="text-center text-gray-600">请进行签名验证登录</p>
              <button
                onClick={login}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                签名登录
              </button>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-600">请先连接钱包</div>
          )}
        </div>
      </div>
    </main>
  );
}
