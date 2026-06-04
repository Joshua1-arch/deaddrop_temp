"use client";

import React, { createContext, useContext, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  createNetworkConfig, 
  SuiClientProvider, 
  WalletProvider as SuiWalletProvider,
  useCurrentAccount,
  useDisconnectWallet,
  ConnectModal
} from "@mysten/dapp-kit";

// Create a single QueryClient instance for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Configure the network to use Tatum's Sui RPC endpoints
const { networkConfig } = createNetworkConfig({
  mainnet: { url: "https://sui-mainnet.gateway.tatum.io/", network: "mainnet" },
  testnet: { url: "https://fullnode.testnet.sui.io:443", network: "testnet" },
  devnet: { url: "https://sui-devnet.gateway.tatum.io/", network: "devnet" },
});

// Custom dark theme to match DeadDrop's aesthetics
const customDarkTheme = {
  blurs: {
    modalOverlay: "blur(4px)",
  },
  backgroundColors: {
    primaryButton: "#00d4b4",
    primaryButtonHover: "#00f5cf",
    outlineButtonHover: "rgba(255, 255, 255, 0.05)",
    walletItemHover: "rgba(255, 255, 255, 0.05)",
    walletItemSelected: "rgba(0, 212, 180, 0.1)",
    modalOverlay: "rgba(0, 0, 0, 0.8)",
    modalPrimary: "#0B0B10",
    modalSecondary: "#12121A",
    iconButton: "transparent",
    iconButtonHover: "rgba(255, 255, 255, 0.05)",
    dropdownMenu: "#0B0B10",
    dropdownMenuSeparator: "rgba(255, 255, 255, 0.05)",
  },
  borderColors: {
    outlineButton: "rgba(255, 255, 255, 0.1)",
  },
  colors: {
    primaryButton: "#0A0A0F",
    outlineButton: "#F0F0F0",
    body: "#F0F0F0",
    bodyMuted: "#9F9FA5",
    bodyDanger: "#FF4D4D",
    iconButton: "#F0F0F0",
  },
  radii: {
    small: "6px",
    medium: "8px",
    large: "12px",
    xlarge: "16px",
  },
  shadows: {
    primaryButton: "0 0 12px rgba(0, 212, 180, 0.3)",
    walletItemSelected: "none",
  },
  fontWeights: {
    normal: "400",
    medium: "500",
    bold: "600",
  },
  fontSizes: {
    small: "0.8rem",
    medium: "0.9rem",
    large: "1.05rem",
    xlarge: "1.25rem",
  },
  typography: {
    fontFamily: "var(--font-inter), sans-serif",
    fontStyle: "normal",
    lineHeight: "1.4",
    letterSpacing: "normal",
  },
};

interface WalletContextType {
  isConnected: boolean;
  address: string;
  connect: () => void;
  disconnect: () => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// State wrapper to adapt dapp-kit hooks into our existing useWallet schema
function WalletStateWrapper({ children }: { children: React.ReactNode }) {
  const account = useCurrentAccount();
  const { mutate: disconnectReal } = useDisconnectWallet();
  const [showModal, setShowModal] = useState(false);
  const [mockConnected, setMockConnected] = useState(false);

  const mockAddress = "0x789b52a1c0d48f93e32c81e9f012a456b3cd1278e90ab12c456df789a012bc34";

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mockWallet") === "true") {
        setMockConnected(true);
      }
    }
  }, []);

  const isConnected = !!account || mockConnected;
  const address = account?.address ?? (mockConnected ? mockAddress : "");

  const connect = () => {
    setShowModal(true);
  };

  const disconnect = () => {
    if (mockConnected) {
      setMockConnected(false);
    } else {
      disconnectReal();
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        connect,
        disconnect,
        showModal,
        setShowModal,
      }}
    >
      {children}
      
      {/* Controlled ConnectModal from @mysten/dapp-kit */}
      <ConnectModal
        trigger={<span className="hidden" style={{ display: "none" }} />}
        open={showModal}
        onOpenChange={setShowModal}
      />
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <SuiWalletProvider autoConnect theme={customDarkTheme}>
          <WalletStateWrapper>{children}</WalletStateWrapper>
        </SuiWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
