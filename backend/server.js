import express from 'express';
import cors from 'cors';
import { paymentMiddleware, Network } from '@coinbase/x402';
import { Aptos, AptosConfig } from '@aptos-labs/ts-sdk';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// CONFIGURACIÓN
// ============================================

const CONTRACT_ADDRESS = '0x0a10dde9540e854e79445a37ed6636086128cfc4d13638077e983a14a4398056';

// Tu wallet que recibe los pagos (también será el payment_processor en el contrato)
const MERCHANT_WALLET = process.env.MERCHANT_WALLET || '0xTU_WALLET_ADDRESS';

// Clave privada del payment_processor para firmar txs en Movement
const PAYMENT_PROCESSOR_PRIVATE_KEY = process.env.PAYMENT_PROCESSOR_PRIVATE_KEY;

// Movement Network Config
const movementConfig = new AptosConfig({
  fullnode: 'https://aptos.testnet.porto.movementlabs.xyz/v1',
});
const aptos = new Aptos(movementConfig);

// ============================================
// UTILIDADES
// ============================================

// Generar QR hash único para cada ticket
const generateQrHash = (eventAddress, buyer, timestamp) => {
  const data = `${eventAddress}-${buyer}-${timestamp}-${crypto.randomBytes(16).toString('hex')}`;
  return Array.from(crypto.createHash('sha256').update(data).digest());
};

// Función para mintear ticket en Movement después del pago
const mintTicketOnChain = async (eventObjectAddress, buyerAddress, qrHash) => {
  try {
    // Crear cuenta del payment processor
    const account = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(PAYMENT_PROCESSOR_PRIVATE_KEY),
    });

    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${CONTRACT_ADDRESS}::ticket::mint_ticket_after_payment`,
        functionArguments: [eventObjectAddress, buyerAddress, qrHash],
      },
    });

    const pendingTx = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const result = await aptos.waitForTransaction({
      transactionHash: pendingTx.hash,
    });

    return {
      success: true,
      txHash: pendingTx.hash,
      ticketAddress: result.events?.find(e => e.type.includes('TicketPurchased'))?.data?.ticket_address,
    };
  } catch (error) {
    console.error('Error minting ticket:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// RUTAS SIN PAGO
// ============================================

// Obtener todos los eventos disponibles
app.get('/api/events', async (req, res) => {
  try {
    // Aquí consultarías el indexer de Movement
    // Por ahora retornamos datos de ejemplo
    res.json({
      events: [
        {
          address: '0x123...', // Dirección del objeto Event en Movement
          name: 'VIP Gala Night',
          description: 'Exclusive event',
          totalTickets: 200,
          ticketsSold: 75,
          ticketPrice: 1000000, // En USDC atomic units (6 decimals) = $1
          isActive: true,
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener info de un evento específico
app.get('/api/events/:eventAddress', async (req, res) => {
  try {
    const { eventAddress } = req.params;
    
    // Llamar view function en Movement
    const response = await fetch(`${movementConfig.fullnode}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: `${CONTRACT_ADDRESS}::ticket::get_event_info`,
        type_arguments: [],
        arguments: [eventAddress],
      }),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener tickets de un usuario (via indexer)
app.get('/api/tickets/:ownerAddress', async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    
    const query = `
      query GetTicketsByOwner($address: String!) {
        events(
          where: {
            type: { _eq: "${CONTRACT_ADDRESS}::ticket::TicketPurchased" },
            data: { _contains: { buyer: $address } }
          }
          order_by: { transaction_version: desc }
        ) {
          data
          transaction_version
        }
      }
    `;
    
    const response = await fetch('https://indexer.testnet.porto.movementnetwork.xyz/v1/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { address: ownerAddress } }),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS CON PAGO x402
// ============================================

// Middleware x402 para la ruta de compra de tickets
// Este endpoint requiere pago antes de procesar
app.post('/api/purchase-ticket',
  // El middleware x402 intercepta y requiere pago
  paymentMiddleware(MERCHANT_WALLET, {
    '/api/purchase-ticket': '$1.00', // Precio base, se puede hacer dinámico
  }, {
    network: Network.BASE_SEPOLIA, // Usa BASE_MAINNET en producción
  }),
  async (req, res) => {
    try {
      const { eventAddress, buyerAddress } = req.body;
      
      // El pago ya fue verificado por el middleware x402
      // Ahora minteamos el ticket en Movement
      
      const qrHash = generateQrHash(eventAddress, buyerAddress, Date.now());
      
      const result = await mintTicketOnChain(eventAddress, buyerAddress, qrHash);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Ticket purchased successfully!',
          ticketAddress: result.ticketAddress,
          txHash: result.txHash,
          qrData: Buffer.from(qrHash).toString('base64'), // Para generar QR en frontend
        });
      } else {
        // Si falla el mint, deberíamos reembolsar (en producción)
        res.status(500).json({
          success: false,
          error: 'Failed to mint ticket on chain',
          details: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Endpoint con precio dinámico basado en el evento
app.post('/api/purchase-ticket-dynamic', async (req, res, next) => {
  const { eventAddress } = req.body;
  
  // Obtener precio del evento desde el contrato
  try {
    const response = await fetch(`${movementConfig.fullnode}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: `${CONTRACT_ADDRESS}::ticket::get_ticket_price`,
        type_arguments: [],
        arguments: [eventAddress],
      }),
    });
    
    const [priceInAtomicUnits] = await response.json();
    const priceInUSD = Number(priceInAtomicUnits) / 1000000; // Convertir de 6 decimales
    
    // Aplicar middleware x402 con precio dinámico
    const dynamicMiddleware = paymentMiddleware(MERCHANT_WALLET, {
      '/api/purchase-ticket-dynamic': `$${priceInUSD.toFixed(2)}`,
    }, {
      network: Network.BASE_SEPOLIA,
    });
    
    dynamicMiddleware(req, res, next);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}, async (req, res) => {
  // Mismo código de mint que arriba
  const { eventAddress, buyerAddress } = req.body;
  const qrHash = generateQrHash(eventAddress, buyerAddress, Date.now());
  const result = await mintTicketOnChain(eventAddress, buyerAddress, qrHash);
  
  if (result.success) {
    res.json({
      success: true,
      ticketAddress: result.ticketAddress,
      txHash: result.txHash,
      qrData: Buffer.from(qrHash).toString('base64'),
    });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

// ============================================
// AI RECOMMENDATIONS (AWS Bedrock)
// ============================================

app.post('/api/ai/recommendations', async (req, res) => {
  const { businessProfileData, question } = req.body;
  
  // Aquí integrarías AWS Bedrock
  // Por ahora un placeholder
  const prompt = `
    Eres un asistente de negocios para eventos. 
    Datos del negocio:
    - Capacidad máxima: ${businessProfileData.maxCapacity}
    - Días pico: ${businessProfileData.peakDays}
    - Tasa de retorno: ${businessProfileData.customerReturnRate}%
    
    Pregunta: ${question}
    
    Responde de forma concisa y profesional.
  `;
  
  // TODO: Llamar a AWS Bedrock aquí
  res.json({
    recommendation: `Basado en tu capacidad de ${businessProfileData.maxCapacity} y una tasa de retorno del ${businessProfileData.customerReturnRate}%, te recomiendo crear 150 tickets para tu próximo evento.`,
  });
});

// ============================================
// SERVIDOR
// ============================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💰 Merchant wallet: ${MERCHANT_WALLET}`);
});
