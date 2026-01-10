// src/hooks/useX402Payment.js
import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://d4y2c4layjh2.cloudfront.net';

// USDC en Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const BASE_SEPOLIA_CHAIN_ID = 84532;

// Generar bytes32 aleatorio para nonce
const generateBytes32 = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

export function useX402Payment() {
  const { user, ready } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getWallet = useCallback(() => {
    if (!wallets || wallets.length === 0) return null;
    return wallets[0];
  }, [wallets]);

  // Función para firmar la autorización de pago
  const signPaymentAuthorization = useCallback(async (amountUSD) => {
    const wallet = getWallet();
    if (!wallet) {
      throw new Error('Wallet no conectada');
    }

    const provider = await wallet.getEthereumProvider();
    
    // Verificar chain
    const chainId = await provider.request({ method: 'eth_chainId' });
    if (parseInt(chainId, 16) !== BASE_SEPOLIA_CHAIN_ID) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x14a34' }],
        });
      } catch (switchError) {
        throw new Error('Por favor cambia a Base Sepolia en tu wallet');
      }
    }

    const amountInUSDC = Math.floor(amountUSD * 1_000_000);
    const nonce = generateBytes32();
    const validAfter = 0;
    const validBefore = Math.floor(Date.now() / 1000) + 3600;
    const payTo = import.meta.env.VITE_PAYMENT_RECEIVER || '0x209693bc6bfc0c8f852a69f91a435f9fd52bbe69';

    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      },
      primaryType: 'TransferWithAuthorization',
      domain: {
        name: 'USD Coin',
        version: '2',
        chainId: BASE_SEPOLIA_CHAIN_ID,
        verifyingContract: USDC_ADDRESS,
      },
      message: {
        from: wallet.address,
        to: payTo,
        value: amountInUSDC.toString(),
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce: nonce,
      },
    };

    const signature = await provider.request({
      method: 'eth_signTypedData_v4',
      params: [wallet.address, JSON.stringify(typedData)],
    });

    return {
      from: wallet.address,
      to: payTo,
      value: amountInUSDC.toString(),
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce,
      signature,
      chainId: BASE_SEPOLIA_CHAIN_ID,
    };
  }, [getWallet]);

  // Función principal: comprar ticket con x402
  const purchaseTicket = useCallback(async (eventAddress, amountUSD) => {
    setLoading(true);
    setError(null);

    try {
      const wallet = getWallet();
      if (!wallet) {
        throw new Error('Wallet no conectada');
      }

      console.log('🔐 Signing payment authorization...');
      
      // 1. Firmar la autorización
      const authData = await signPaymentAuthorization(amountUSD);
      
      console.log('✅ Signed! Sending to backend...');
      
      // 2. Codificar en base64 para el header
      const xPaymentHeader = btoa(JSON.stringify(authData));
      
      // 3. Enviar al backend
      const response = await fetch(`${API_URL}/api/tickets/purchase/${eventAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-payment': xPaymentHeader,
        },
        body: JSON.stringify({ 
          buyerAddress: wallet.address 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Purchase failed');
      }

      console.log('🎉 Ticket purchased!', result);

      return {
        success: true,
        ticket: result.ticket,
        payment: result.payment,
        movementTx: result.movementTx,
      };

    } catch (err) {
      console.error('Error en compra:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  }, [getWallet, signPaymentAuthorization]);

  const hasWallet = useCallback(() => {
    const wallet = getWallet();
    return !!wallet?.address;
  }, [getWallet]);

  const getWalletAddress = useCallback(() => {
    const wallet = getWallet();
    return wallet?.address || null;
  }, [getWallet]);

  return {
    purchaseTicket,
    signPaymentAuthorization,
    loading,
    error,
    hasWallet,
    getWalletAddress,
    ready,
  };
}

export default useX402Payment;
