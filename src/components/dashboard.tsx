"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

// 定义交易类型
interface Transaction {
  id: string;
  hash?: string;
  amount?: string;
  timestamp?: number;
  status?: string;
  to?: string;
  from?: string;
}

// 定义用户数据类型
interface UserData {
  address?: string;
  balance?: string;
  network?: string;
  connectedAt?: number; // 假设这是时间戳
  transactions?: Transaction[]; // 交易数组
}

// 定义 useAuth 返回类型
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userData: UserData | null;
}

export default function Dashboard() {
  const { isAuthenticated, isLoading, userData } = useAuth() as AuthContextType;
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">加载中...</div>
    );
  }

  if (!isAuthenticated) {
    return null; // 将会被重定向
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">仪表盘</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">用户信息</h2>

        <div className="space-y-2">
          <p>
            <span className="font-medium">地址:</span>{" "}
            {userData?.address || "未知"}
          </p>
          <p>
            <span className="font-medium">余额:</span>{" "}
            {userData?.balance || "未知"} ETH
          </p>
          <p>
            <span className="font-medium">网络:</span>{" "}
            {userData?.network || "未知"}
          </p>
          <p>
            <span className="font-medium">连接时间:</span>{" "}
            {userData?.connectedAt
              ? new Date(userData.connectedAt).toLocaleString()
              : "未知"}
          </p>
          {/* 显示更多用户数据 */}
        </div>
      </div>

      <div className="mt-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">交易历史</h2>
        {userData?.transactions && userData.transactions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {userData.transactions.map((tx: Transaction, index: number) => (
              <li key={tx.id || index} className="py-3 px-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      交易ID: {tx.hash?.slice(0, 10)}...{tx.hash?.slice(-8)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.timestamp
                        ? new Date(tx.timestamp).toLocaleString()
                        : "未知时间"}
                    </p>
                    <p className="mt-1">
                      {tx.from && (
                        <span className="text-xs text-gray-500">
                          从: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                        </span>
                      )}
                      {tx.to && (
                        <span className="text-xs text-gray-500 ml-2">
                          至: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{tx.amount || "0"} ETH</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        tx.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : tx.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tx.status || "未知"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">暂无交易记录</p>
        )}
      </div>
    </div>
  );
}
