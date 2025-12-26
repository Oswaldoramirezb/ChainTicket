import express from 'express';
import cors from 'cors';
import { Aptos, AptosConfig } from '@aptos-labs/ts-sdk';
import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// DATABASE CONFIGURATION
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ============================================
// USER ROUTES
// ============================================

// Get user by Privy ID
app.get('/api/users/:privyId', async (req, res) => {
  try {
    const { privyId } = req.params;
    const result = await pool.query(
      'SELECT * FROM users WHERE privy_id = $1',
      [privyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ found: false });
    }
    
    res.json({ found: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update user
app.post('/api/users', async (req, res) => {
  try {
    const { privyId, walletAddress, userType, profile } = req.body;
    
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE privy_id = $1',
      [privyId]
    );
    
    if (existingUser.rows.length > 0) {
      // Update existing user
      const result = await pool.query(
        `UPDATE users SET 
          wallet_address = COALESCE($2, wallet_address),
          user_type = COALESCE($3, user_type),
          full_name = COALESCE($4, full_name),
          email = COALESCE($5, email),
          phone = COALESCE($6, phone),
          location = COALESCE($7, location),
          business_name = COALESCE($8, business_name),
          profile_complete = COALESCE($9, profile_complete),
          updated_at = CURRENT_TIMESTAMP
        WHERE privy_id = $1
        RETURNING *`,
        [
          privyId,
          walletAddress,
          userType,
          profile?.fullName,
          profile?.email,
          profile?.phone,
          profile?.location,
          profile?.businessName,
          profile?.fullName ? true : false
        ]
      );
      return res.json({ success: true, user: result.rows[0], isNew: false });
    }
    
    // Create new user
    const result = await pool.query(
      `INSERT INTO users (privy_id, wallet_address, user_type, full_name, email, phone, location, business_name, profile_complete)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        privyId,
        walletAddress,
        userType || 'user',
        profile?.fullName,
        profile?.email,
        profile?.phone,
        profile?.location,
        profile?.businessName,
        profile?.fullName ? true : false
      ]
    );
    
    res.json({ success: true, user: result.rows[0], isNew: true });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.patch('/api/users/:privyId', async (req, res) => {
  try {
    const { privyId } = req.params;
    const { userType, profile } = req.body;
    
    const result = await pool.query(
      `UPDATE users SET 
        user_type = COALESCE($2, user_type),
        full_name = COALESCE($3, full_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        location = COALESCE($6, location),
        business_name = COALESCE($7, business_name),
        profile_complete = COALESCE($8, profile_complete),
        updated_at = CURRENT_TIMESTAMP
      WHERE privy_id = $1
      RETURNING *`,
      [
        privyId,
        userType,
        profile?.fullName,
        profile?.email,
        profile?.phone,
        profile?.location,
        profile?.businessName,
        profile?.fullName ? true : false
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

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
  network: 'custom',
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
// RUTAS DE COMPRA DE TICKETS (Pendiente configuración x402)
// ============================================

// Endpoint de compra de tickets (sin x402 por ahora - configurar después)
app.post('/api/purchase-ticket', async (req, res) => {
  try {
    const { eventAddress, buyerAddress } = req.body;
    
    const qrHash = generateQrHash(eventAddress, buyerAddress, Date.now());
    const result = await mintTicketOnChain(eventAddress, buyerAddress, qrHash);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Ticket purchased successfully!',
        ticketAddress: result.ticketAddress,
        txHash: result.txHash,
        qrData: Buffer.from(qrHash).toString('base64'),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to mint ticket on chain',
        details: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
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
