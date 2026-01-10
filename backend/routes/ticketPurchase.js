// backend/routes/ticketPurchase.js
import { verifyTypedData, createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

import express from 'express';
import crypto from 'crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

const router = express.Router();

// Configuración de Movement
const CONTRACT_ADDRESS = process.env.CONTRACT_MODULE_ADDRESS || '2339acd68a5b699c8bfefed62febcf497959ca55527227e980c56031b3bfced9'
const MOVEMENT_RPC = process.env.MOVEMENT_RPC_URL || 'https://testnet.movementnetwork.xyz/v1'
const MOVEMENT_INDEXER = process.env.MOVEMENT_INDEXER_URL || 'https://hasura.testnet.movementnetwork.xyz/v1/graphql'

// USDC en Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Inicializar Aptos client para Movement
const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: MOVEMENT_RPC,
  indexer: MOVEMENT_INDEXER,
});
const aptos = new Aptos(aptosConfig);

// Cliente para Base Sepolia (lectura)
const baseClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_RPC_URL || 'https://sepolia.base.org')
});

// ============================================
// FUNCIÓN: Ejecutar transferWithAuthorization en Base
// ============================================
async function executeTransferWithAuthorization(authData) {
  const { from, to, value, validAfter, validBefore, nonce, signature } = authData;
  
  // Wallet del relayer que paga el gas (necesita ETH en Base Sepolia)
  const relayerPrivateKey = process.env.BASE_RELAYER_PRIVATE_KEY;
  if (!relayerPrivateKey) {
    throw new Error('BASE_RELAYER_PRIVATE_KEY not configured');
  }
  
  const account = privateKeyToAccount(relayerPrivateKey);
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.BASE_RPC_URL || 'https://sepolia.base.org'),
  });

  // Separar firma en v, r, s
  const r = signature.slice(0, 66);
  const s = '0x' + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);

  const abi = parseAbi([
    'function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)'
  ]);

  console.log('💸 Executing transferWithAuthorization...');
  console.log('   From:', from);
  console.log('   To:', to);
  console.log('   Value:', value);

  const txHash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi,
    functionName: 'transferWithAuthorization',
    args: [
      from,
      to,
      BigInt(value),
      BigInt(validAfter),
      BigInt(validBefore),
      nonce,
      v,
      r,
      s
    ],
  });

  console.log('⏳ Waiting for confirmation... TxHash:', txHash);

  // Esperar confirmación
  const receipt = await baseClient.waitForTransactionReceipt({ hash: txHash });
  
  if (receipt.status !== 'success') {
    throw new Error('USDC transfer failed on-chain');
  }

  console.log('✅ USDC transferred successfully!');
  return txHash;
}

// ============================================
// FUNCIÓN: Obtener precio del evento desde el indexer
// ============================================
async function getEventPrice(eventAddress) {
  try {
    const query = `
      query GetEventData {
        current_objects(
          where: {object_address: {_eq: "${eventAddress}"}}
        ) {
          object_address
          owner_address
        }
      }
    `;
    
    const response = await fetch(MOVEMENT_INDEXER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const result = await response.json();
    
    if (!result.data?.current_objects?.length) {
      return await getEventPriceFromContract(eventAddress);
    }
    
    return await getEventPriceFromContract(eventAddress);
    
  } catch (error) {
    console.error('Error fetching event price from indexer:', error);
    return await getEventPriceFromContract(eventAddress);
  }
}

// View function para obtener precio directamente del contrato
async function getEventPriceFromContract(eventAddress) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS}::ticket::get_ticket_price`,
        typeArguments: [],
        functionArguments: [eventAddress]
      }
    });
    
    const priceInSmallestUnit = Number(result[0]);
    const priceInUSD = priceInSmallestUnit / 1_000_000;
    
    return priceInUSD;
  } catch (error) {
    console.error('Error getting price from contract:', error);
    return 5.00;
  }
}

// ============================================
// FUNCIÓN: Obtener info completa del evento
// ============================================
async function getEventInfo(eventAddress) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS}::ticket::get_event_info`,
        typeArguments: [],
        functionArguments: [eventAddress]
      }
    });
    
    return {
      name: result[0],
      adminRegistry: result[1],
      totalTickets: Number(result[2]),
      ticketsSold: Number(result[3]),
      ticketPrice: Number(result[4]) / 1_000_000,
      isActive: result[5],
      isCancelled: result[6],
      transferable: result[7],
      resalable: result[8],
      permanent: result[9],
      refundable: result[10],
      paymentProcessor: result[11]
    };
  } catch (error) {
    console.error('Error getting event info:', error);
    throw new Error('Event not found');
  }
}

// ============================================
// FUNCIÓN: Mintear ticket después del pago
// ============================================
async function mintTicketOnChain(eventAddress, buyerAddress, paymentTxHash) {
  try {
    let formattedBuyer = buyerAddress;
    if (buyerAddress.startsWith('0x')) {
      const addressWithout0x = buyerAddress.slice(2);
      if (addressWithout0x.length < 64) {
        formattedBuyer = '0x' + addressWithout0x.padStart(64, '0');
      }
    }
    console.log('📝 Formatted buyer address:', formattedBuyer);

    const privateKeyHex = process.env.PAYMENT_PROCESSOR_PRIVATE_KEY;
    if (!privateKeyHex) {
      throw new Error('Payment processor private key not configured');
    }
    
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const paymentProcessor = Account.fromPrivateKey({ privateKey });
    
    const qrHash = crypto.createHash('sha256')
      .update(`${eventAddress}-${formattedBuyer}-${paymentTxHash}-${Date.now()}`)
      .digest();
    
    const transaction = await aptos.transaction.build.simple({
      sender: paymentProcessor.accountAddress,
      data: {
        function: `${CONTRACT_ADDRESS}::ticket::mint_ticket_after_payment`,
        typeArguments: [],
        functionArguments: [
          eventAddress,
          formattedBuyer,
          Array.from(qrHash)
        ]
      }
    });
    
    const pendingTx = await aptos.signAndSubmitTransaction({
      signer: paymentProcessor,
      transaction
    });
    
    const committedTx = await aptos.waitForTransaction({
      transactionHash: pendingTx.hash
    });
    
    let ticketAddress = null;
    if (committedTx.events) {
      const purchaseEvent = committedTx.events.find(
        e => e.type.includes('::ticket::TicketPurchased')
      );
      if (purchaseEvent) {
        ticketAddress = purchaseEvent.data.ticket_address;
      }
    }
    
    return {
      success: true,
      txHash: pendingTx.hash,
      ticketAddress,
      qrHash: qrHash.toString('hex'),
      buyer: formattedBuyer
    };
    
  } catch (error) {
    console.error('Error minting ticket on-chain:', error);
    throw error;
  }
}

// ============================================
// MIDDLEWARE: x402 Dynamic Payment
// ============================================
function createDynamicPaymentMiddleware() {
  return async (req, res, next) => {
    const eventAddress = req.params.eventAddress;
    const paymentHeader = req.headers['x-payment'];
    
    try {
      const price = await getEventPrice(eventAddress);
      
      if (!paymentHeader) {
        return res.status(402).json({
          error: 'Payment Required',
          paymentDetails: {
            scheme: 'x402',
            network: 'base-sepolia',
            receiver: process.env.PAYMENT_RECEIVER_ADDRESS,
            amount: price.toString(),
            currency: 'USDC',
            eventAddress,
            description: `Ticket purchase for event ${eventAddress}`,
            paymentInstructions: {
              chainId: 84532,
              token: USDC_ADDRESS,
              recipient: process.env.PAYMENT_RECEIVER_ADDRESS,
              amount: Math.floor(price * 1_000_000).toString(),
            }
          }
        });
      }
      
      const paymentValid = await verifyX402Payment(paymentHeader, price);
      
      if (!paymentValid.valid) {
        return res.status(402).json({
          error: 'Invalid Payment',
          message: paymentValid.error,
          paymentDetails: {
            scheme: 'x402',
            receiver: process.env.PAYMENT_RECEIVER_ADDRESS,
            amount: price.toString(),
            currency: 'USDC'
          }
        });
      }
      
      req.paymentInfo = paymentValid;
      next();
      
    } catch (error) {
      console.error('Payment middleware error:', error);
      return res.status(500).json({
        error: 'Payment verification failed',
        message: error.message
      });
    }
  };
}

// ============================================
// FUNCIÓN: Verificar pago x402
// ============================================
async function verifyX402Payment(paymentHeader, expectedAmount) {
  // En desarrollo, siempre aprobar (pero aún parsear el header)
  if (process.env.NODE_ENV === 'development') {
    console.warn('🧪 DEV MODE: Skipping real USDC transfer');
    try {
      const paymentData = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
      return { 
        valid: true, 
        txHash: paymentData.txHash || `dev-${Date.now()}`,
        amount: expectedAmount,
        sender: paymentData.from || paymentData.sender || 'dev-user'
      };
    } catch {
      return { valid: true, txHash: `dev-${Date.now()}`, amount: expectedAmount, sender: 'dev-user' };
    }
  }

  try {
    // Decodificar header
    const authData = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
    const { from, to, value, validAfter, validBefore, nonce, signature, chainId } = authData;
    
    console.log('🔍 Verifying x402 payment...');
    console.log('   From:', from);
    console.log('   To:', to);
    console.log('   Value:', value);
    
    // Verificar chain
    if (chainId !== 84532) {
      return { valid: false, error: 'Invalid chain ID. Expected Base Sepolia (84532)' };
    }
    
    // Verificar que no haya expirado
    const now = Math.floor(Date.now() / 1000);
    if (now >= Number(validBefore)) {
      return { valid: false, error: 'Authorization expired' };
    }
    
    // Verificar monto
    const expectedValueWei = BigInt(Math.floor(expectedAmount * 1000000));
    if (BigInt(value) < expectedValueWei) {
      return { valid: false, error: `Insufficient amount. Expected ${expectedValueWei}, got ${value}` };
    }
    
    // Verificar destinatario
    if (to.toLowerCase() !== process.env.PAYMENT_RECEIVER_ADDRESS.toLowerCase()) {
      return { valid: false, error: 'Invalid recipient' };
    }
    
    // Verificar firma EIP-712
    const isValidSignature = await verifyTypedData({
      address: from,
      domain: {
        name: 'USD Coin',
        version: '2',
        chainId: 84532,
        verifyingContract: USDC_ADDRESS
      },
      types: {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' }
        ]
      },
      primaryType: 'TransferWithAuthorization',
      message: {
        from,
        to,
        value: BigInt(value),
        validAfter: BigInt(validAfter),
        validBefore: BigInt(validBefore),
        nonce
      },
      signature
    });
    
    if (!isValidSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    console.log('✅ Signature valid! Executing transfer...');
    
    // ✅ EJECUTAR LA TRANSFERENCIA REAL DE USDC
    const txHash = await executeTransferWithAuthorization(authData);
    
    return {
      valid: true,
      txHash,
      amount: expectedAmount,
      sender: from
    };
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return { valid: false, error: error.message || 'Invalid payment format' };
  }
}

// ============================================
// RUTAS
// ============================================

// GET /api/tickets/price/:eventAddress
router.get('/price/:eventAddress', async (req, res) => {
  const { eventAddress } = req.params;
  
  try {
    const price = await getEventPrice(eventAddress);
    const eventInfo = await getEventInfo(eventAddress);
    
    return res.json({
      eventAddress,
      price,
      currency: 'USD',
      eventName: eventInfo.name,
      ticketsRemaining: eventInfo.totalTickets - eventInfo.ticketsSold,
      isActive: eventInfo.isActive
    });
  } catch (error) {
    return res.status(404).json({ 
      error: 'Event not found',
      message: error.message 
    });
  }
});

// GET /api/tickets/event/:eventAddress
router.get('/event/:eventAddress', async (req, res) => {
  const { eventAddress } = req.params;
  
  try {
    const eventInfo = await getEventInfo(eventAddress);
    return res.json(eventInfo);
  } catch (error) {
    return res.status(404).json({ 
      error: 'Event not found',
      message: error.message 
    });
  }
});

// POST /api/tickets/purchase/:eventAddress - Comprar ticket con x402
router.post(
  '/purchase/:eventAddress',
  createDynamicPaymentMiddleware(),
  async (req, res) => {
    const { eventAddress } = req.params;
    const buyerAddress = req.body.buyerAddress || req.headers['x-buyer-address'];
    
    if (!buyerAddress) {
      return res.status(400).json({
        error: 'Buyer address required',
        message: 'Provide buyerAddress in body or x-buyer-address header'
      });
    }
    
    try {
      console.log('🎟️ Minting ticket for:', buyerAddress);
      
      const mintResult = await mintTicketOnChain(
        eventAddress,
        buyerAddress,
        req.paymentInfo.txHash
      );
      
      console.log('🎉 Ticket minted successfully!', mintResult.ticketAddress);
      
      return res.status(200).json({
        success: true,
        message: 'Ticket purchased successfully',
        ticket: {
          address: mintResult.ticketAddress,
          eventAddress,
          owner: buyerAddress,
          qrHash: mintResult.qrHash
        },
        payment: {
          txHash: req.paymentInfo.txHash,
          amount: req.paymentInfo.amount,
          network: 'base-sepolia'
        },
        movementTx: {
          hash: mintResult.txHash
        }
      });
      
    } catch (error) {
      console.error('Error minting ticket:', error);
      return res.status(500).json({
        success: false,
        error: 'Error creating ticket',
        message: error.message
      });
    }
  }
);

// POST /api/tickets/purchase-free/:eventAddress
router.post('/purchase-free/:eventAddress', async (req, res) => {
  const { eventAddress } = req.params;
  const { buyerAddress } = req.body;
  
  if (!buyerAddress) {
    return res.status(400).json({ error: 'Buyer address required' });
  }
  
  try {
    const eventInfo = await getEventInfo(eventAddress);
    if (eventInfo.ticketPrice > 0) {
      return res.status(402).json({
        error: 'Payment required',
        price: eventInfo.ticketPrice
      });
    }
    
    const mintResult = await mintTicketOnChain(eventAddress, buyerAddress, 'free');
    
    return res.json({
      success: true,
      ticket: {
        address: mintResult.ticketAddress,
        qrHash: mintResult.qrHash
      },
      txHash: mintResult.txHash
    });
    
  } catch (error) {
    return res.status(500).json({
      error: 'Error creating ticket',
      message: error.message
    });
  }
});

export default router;
