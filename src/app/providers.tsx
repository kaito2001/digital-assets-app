"use client";

import { WagmiProvider, createConfig, createStorage, cookieStorage } from "wagmi";
import { http } from "viem";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { Chain } from "viem/chains";

// ✅ Cấu hình mạng Arbitrum Sepolia
const myCustomChain: Chain = {
  id: 2741608569515000,
  name: "AVBI",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://avbi-2741608569515000-1.jsonrpc.testnet.sagarpc.io"] } },
};

// ✅ Cấu hình Wagmi
const queryClient = new QueryClient();
const config = createConfig({
  chains: [myCustomChain],
  transports: { [myCustomChain.id]: http() },
  connectors: [],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});

// ✅ Thêm ConfigProvider vào Providers
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ConfigProvider>
  );
}
