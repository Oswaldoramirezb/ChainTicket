import { useState } from 'react';

export const useTransactionWithFeedback = () => {
    const [txState, setTxState] = useState({
        isOpen: false,
        status: 'preparing', // 'preparing', 'signing', 'confirming', 'success', 'error'
        message: '',
        txHash: null
    });

    const executeTransaction = async (transactionFn, successMessage = 'Transacción completada') => {
        try {
            // Step 1: Preparing
            setTxState({
                isOpen: true,
                status: 'preparing',
                message: '',
                txHash: null
            });

            await new Promise(resolve => setTimeout(resolve, 800)); // Simular preparación

            // Step 2: Signing
            setTxState(prev => ({
                ...prev,
                status: 'signing',
                message: 'Firmando con tu wallet de Privy...'
            }));

            // Execute the actual transaction
            const result = await transactionFn();

            // Step 3: Confirming
            setTxState(prev => ({
                ...prev,
                status: 'confirming',
                message: 'Esperando confirmación en Movement...'
            }));

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simular confirmación

            // Step 4: Success
            setTxState({
                isOpen: true,
                status: 'success',
                message: successMessage,
                txHash: result?.hash || result?.transactionHash || null
            });

            return result;

        } catch (error) {
            // Error state
            setTxState({
                isOpen: true,
                status: 'error',
                message: error.message || 'Error al procesar la transacción',
                txHash: null
            });
            throw error;
        }
    };

    const closeFeedback = () => {
        setTxState({
            isOpen: false,
            status: 'preparing',
            message: '',
            txHash: null
        });
    };

    return {
        txState,
        executeTransaction,
        closeFeedback
    };
};

