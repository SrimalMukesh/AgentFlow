import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import LuteConnect from 'lute-connect';

interface WalletContextType {
  connectedAddress: string | null;
  activeAddress: string;
  shortAddress: string;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  formatAddress: (addr: string) => string;
}

const STORAGE_KEY = 'agentflow_connected_wallet';

export function formatShortAddress(addr: string): string {
  if (!addr) return '';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY) || null;
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connectedAddress) {
      localStorage.setItem(STORAGE_KEY, connectedAddress);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [connectedAddress]);

  const connect = useCallback(async (): Promise<string | null> => {
    setIsConnecting(true);
    setError(null);
    try {
      const lute = new LuteConnect('AgentFlow');
      const addresses = await lute.connect('testnet-v1.0');
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        setConnectedAddress(address);
        setIsConnecting(false);
        return address;
      } else {
        throw new Error('No Lute wallet account found.');
      }
    } catch (err: unknown) {
      console.warn('Lute connection attempt:', err);
      setError('Wallet connection failed. Please try again.');
      setIsConnecting(false);
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnectedAddress(null);
    setError(null);
  }, []);

  const activeAddress = connectedAddress || '';
  const shortAddress = connectedAddress ? formatShortAddress(connectedAddress) : '';

  return (
    <WalletContext.Provider
      value={{
        connectedAddress,
        activeAddress,
        shortAddress,
        isConnecting,
        error,
        connect,
        disconnect,
        formatAddress: formatShortAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
