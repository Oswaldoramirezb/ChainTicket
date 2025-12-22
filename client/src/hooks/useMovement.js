import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Configuración de Movement Network
const MOVEMENT_CONFIG = {
  // Testnet (para desarrollo)
  testnet: {
    rpcUrl: 'https://aptos.testnet.porto.movementlabs.xyz/v1',
    indexerUrl: 'https://indexer.testnet.porto.movementnetwork.xyz/v1/graphql',
    chainId: 177,
  },
  // Mainnet (para producción)
  mainnet: {
    rpcUrl: 'https://mainnet.movementnetwork.xyz/v1',
    indexerUrl: 'https://indexer.mainnet.movementnetwork.xyz/v1/graphql',
    chainId: 126,
  }
};

// Dirección de tu contrato deployado
const CONTRACT_ADDRESS = '0x0a10dde9540e854e79445a37ed6636086128cfc4d13638077e983a14a4398056';

// Usar testnet para desarrollo
const NETWORK = 'testnet';
const config = MOVEMENT_CONFIG[NETWORK];

export const useMovement = () => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener el wallet de Privy
  const getWallet = useCallback(() => {
    if (!wallets || wallets.length === 0) return null;
    return wallets[0]; // Embedded wallet de Privy
  }, [wallets]);

  // ============================================
  // FUNCIONES DE ESCRITURA (Transacciones)
  // ============================================

  // Inicializar Admin Registry
  const initializeAdminRegistry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet no conectado');

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::admin_registry::initialize`,
        type_arguments: [],
        arguments: []
      };

      const response = await wallet.sendTransaction(payload);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWallet]);

  // Crear un evento
  const createEvent = useCallback(async ({
    adminRegistryAddress,
    name,
    description,
    totalTickets,
    ticketPrice,
    transferable = true,
    resalable = false,
    permanent = false,
    refundable = true,
    paymentProcessor
  }) => {
    setLoading(true);
    setError(null);
    try {
      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet no conectado');

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::ticket::create_event`,
        type_arguments: [],
        arguments: [
          adminRegistryAddress,
          name,
          description,
          totalTickets.toString(),
          ticketPrice.toString(),
          transferable,
          resalable,
          permanent,
          refundable,
          paymentProcessor
        ]
      };

      const response = await wallet.sendTransaction(payload);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWallet]);

  // Crear Business Profile
  const createBusinessProfile = useCallback(async ({
    businessName,
    businessType,
    maxCapacity,
    averageConsumption,
    peakDays,
    peakHoursStart,
    peakHoursEnd,
    typicalEventDurationHours,
    averageTicketPrice,
    monthlyEventsCount,
    customerReturnRate,
    adminRegistry
  }) => {
    setLoading(true);
    setError(null);
    try {
      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet no conectado');

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::business_profile::create_profile`,
        type_arguments: [],
        arguments: [
          businessName,
          businessType,
          maxCapacity.toString(),
          averageConsumption.toString(),
          peakDays, // vector<u8>
          peakHoursStart,
          peakHoursEnd,
          typicalEventDurationHours,
          averageTicketPrice.toString(),
          monthlyEventsCount,
          customerReturnRate,
          adminRegistry
        ]
      };

      const response = await wallet.sendTransaction(payload);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWallet]);

  // Comprar ticket gratis (precio = 0)
  const purchaseFreeTicker = useCallback(async (eventObjectAddress, qrHash) => {
    setLoading(true);
    setError(null);
    try {
      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet no conectado');

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::ticket::purchase_ticket_free`,
        type_arguments: [],
        arguments: [eventObjectAddress, qrHash]
      };

      const response = await wallet.sendTransaction(payload);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWallet]);

  // Mint ticket después de pago (llamado por backend/x402)
  const mintTicketAfterPayment = useCallback(async (eventObjectAddress, buyerAddress, qrHash) => {
    setLoading(true);
    setError(null);
    try {
      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet no conectado');

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::ticket::mint_ticket_after_payment`,
        type_arguments: [],
        arguments: [eventObjectAddress, buyerAddress, qrHash]
      };

      const response = await wallet.sendTransaction(payload);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWallet]);

  // Usar ticket (check-in por el usuario)
  const useTicket = useCallback(async (ticketObjectAddress) => {
    setLoading(true);
    setError(null);
    try {
      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet no conectado');

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::ticket::use_ticket`,
        type_arguments: [],
        arguments: [ticketObjectAddress]
      };

      const response = await wallet.sendTransaction(payload);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWallet]);

  // Check-in por staff
  const checkIn = useCallback(async (ticketObjectAddress, eventObjectAddress, qrHash) => {
    setLoading(true);
    setError(null);
    try {
      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet no conectado');

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::ticket::check_in`,
        type_arguments: [],
        arguments: [ticketObjectAddress, eventObjectAddress, qrHash]
      };

      const response = await wallet.sendTransaction(payload);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWallet]);

  // Transferir ticket
  const transferTicket = useCallback(async (ticketObjectAddress, recipientAddress) => {
    setLoading(true);
    setError(null);
    try {
      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet no conectado');

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::ticket::transfer_ticket`,
        type_arguments: [],
        arguments: [ticketObjectAddress, recipientAddress]
      };

      const response = await wallet.sendTransaction(payload);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWallet]);

  // Cancelar evento
  const cancelEvent = useCallback(async (eventObjectAddress) => {
    setLoading(true);
    setError(null);
    try {
      const wallet = getWallet();
      if (!wallet) throw new Error('Wallet no conectado');

      const payload = {
        type: 'entry_function_payload',
        function: `${CONTRACT_ADDRESS}::ticket::cancel_event`,
        type_arguments: [],
        arguments: [eventObjectAddress]
      };

      const response = await wallet.sendTransaction(payload);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWallet]);

  // ============================================
  // FUNCIONES DE LECTURA (GraphQL Indexer)
  // ============================================

  // Query genérica al indexer
  const queryIndexer = useCallback(async (query, variables = {}) => {
    try {
      const response = await fetch(config.indexerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      });
      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].message);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Obtener eventos creados por un negocio
  const getEventsByBusiness = useCallback(async (businessAddress) => {
    const query = `
      query GetEventsByBusiness($address: String!) {
        events(
          where: {
            type: { _eq: "${CONTRACT_ADDRESS}::ticket::EventCreated" },
            data: { _contains: { business: $address } }
          }
          order_by: { transaction_version: desc }
        ) {
          data
          transaction_version
          sequence_number
        }
      }
    `;
    return queryIndexer(query, { address: businessAddress });
  }, [queryIndexer]);

  // Obtener tickets de un usuario
  const getTicketsByOwner = useCallback(async (ownerAddress) => {
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
          sequence_number
        }
      }
    `;
    return queryIndexer(query, { address: ownerAddress });
  }, [queryIndexer]);

  // Obtener todos los eventos activos
  const getAllEvents = useCallback(async () => {
    const query = `
      query GetAllEvents {
        events(
          where: {
            type: { _eq: "${CONTRACT_ADDRESS}::ticket::EventCreated" }
          }
          order_by: { transaction_version: desc }
          limit: 100
        ) {
          data
          transaction_version
          sequence_number
        }
      }
    `;
    return queryIndexer(query);
  }, [queryIndexer]);

  // Obtener estadísticas de un evento
  const getEventStats = useCallback(async (eventAddress) => {
    const query = `
      query GetEventStats($eventAddress: String!) {
        purchased: events_aggregate(
          where: {
            type: { _eq: "${CONTRACT_ADDRESS}::ticket::TicketPurchased" },
            data: { _contains: { event_address: $eventAddress } }
          }
        ) {
          aggregate { count }
        }
        used: events_aggregate(
          where: {
            type: { _eq: "${CONTRACT_ADDRESS}::ticket::TicketUsed" },
            data: { _contains: { event_address: $eventAddress } }
          }
        ) {
          aggregate { count }
        }
        checkins: events_aggregate(
          where: {
            type: { _eq: "${CONTRACT_ADDRESS}::ticket::CheckInCompleted" },
            data: { _contains: { event_address: $eventAddress } }
          }
        ) {
          aggregate { count }
        }
      }
    `;
    return queryIndexer(query, { eventAddress });
  }, [queryIndexer]);

  // ============================================
  // FUNCIONES VIEW (RPC directo)
  // ============================================

  const callViewFunction = useCallback(async (functionName, typeArgs = [], args = []) => {
    try {
      const response = await fetch(`${config.rpcUrl}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: `${CONTRACT_ADDRESS}::${functionName}`,
          type_arguments: typeArgs,
          arguments: args
        })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Verificar si ticket es válido
  const isTicketValid = useCallback(async (ticketObjectAddress) => {
    return callViewFunction('ticket::is_ticket_valid', [], [ticketObjectAddress]);
  }, [callViewFunction]);

  // Obtener info del evento
  const getEventInfo = useCallback(async (eventObjectAddress) => {
    return callViewFunction('ticket::get_event_info', [], [eventObjectAddress]);
  }, [callViewFunction]);

  // Obtener info del ticket
  const getTicketInfo = useCallback(async (ticketObjectAddress) => {
    return callViewFunction('ticket::get_ticket_info', [], [ticketObjectAddress]);
  }, [callViewFunction]);

  // Verificar QR hash
  const verifyQrHash = useCallback(async (ticketObjectAddress, hash) => {
    return callViewFunction('ticket::verify_qr_hash', [], [ticketObjectAddress, hash]);
  }, [callViewFunction]);

  // Obtener tickets restantes
  const getTicketsRemaining = useCallback(async (eventObjectAddress) => {
    return callViewFunction('ticket::get_tickets_remaining', [], [eventObjectAddress]);
  }, [callViewFunction]);

  return {
    // Estado
    loading,
    error,
    authenticated,
    wallet: getWallet(),
    
    // Config
    contractAddress: CONTRACT_ADDRESS,
    network: NETWORK,
    
    // Escritura (transacciones)
    initializeAdminRegistry,
    createEvent,
    createBusinessProfile,
    purchaseFreeTicker,
    mintTicketAfterPayment,
    useTicket,
    checkIn,
    transferTicket,
    cancelEvent,
    
    // Lectura (indexer)
    queryIndexer,
    getEventsByBusiness,
    getTicketsByOwner,
    getAllEvents,
    getEventStats,
    
    // View functions (RPC)
    isTicketValid,
    getEventInfo,
    getTicketInfo,
    verifyQrHash,
    getTicketsRemaining,
  };
};

export default useMovement;
