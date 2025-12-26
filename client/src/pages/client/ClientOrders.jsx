import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, QrCode, ShieldCheck, Package, Ticket, ChevronDown, ChevronUp } from 'lucide-react';

const ClientOrders = () => {
    const { orders, services, tickets } = useData();
    const [showNFT, setShowNFT] = useState(null);
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [activeTab, setActiveTab] = useState('tickets');

    const myOrders = orders.filter(o => o.status !== 'archived').sort((a, b) => b.timestamp - a.timestamp);
    const myTickets = tickets.filter(t => t.status === 'active').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const getService = (id) => services.find(s => s.id === id);

    return (
        <div className="space-y-8 pb-24">
            <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2 font-serif text-white tracking-wide">My Tickets & Orders</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Your Digital Access Passes</p>
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('tickets')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'tickets' 
                            ? 'bg-[#FFD700] text-black' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                    <Ticket className="w-4 h-4 inline mr-2" />
                    My Tickets ({myTickets.length})
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'orders' 
                            ? 'bg-[#FFD700] text-black' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                    <Package className="w-4 h-4 inline mr-2" />
                    Orders ({myOrders.length})
                </button>
            </div>

            {activeTab === 'tickets' && (
                <div className="space-y-4">
                    {myTickets.length === 0 ? (
                        <div className="glass-panel p-16 text-center rounded border border-white/5">
                            <Ticket className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 font-serif">No tickets yet. Purchase a service to get your QR ticket!</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {myTickets.map(ticket => {
                                const service = getService(ticket.service_id);
                                const isExpanded = expandedTicket === ticket.id;
                                
                                return (
                                    <motion.div
                                        key={ticket.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-panel rounded-lg overflow-hidden border border-[#FFD700]/20"
                                    >
                                        <div 
                                            className="p-4 cursor-pointer"
                                            onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
                                                        <QrCode className="w-6 h-6 text-[#FFD700]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white">
                                                            {ticket.service_title || service?.title || 'Ticket'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 font-mono">
                                                            {ticket.ticket_number}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 uppercase">
                                                        {ticket.status}
                                                    </span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-500" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-white/10"
                                                >
                                                    <div className="p-6 flex flex-col items-center">
                                                        <div className="w-48 h-48 bg-white p-3 rounded-lg mb-4 shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                                                            <img
                                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qr_hash || ticket.ticket_number)}`}
                                                                alt="Ticket QR Code"
                                                                className="w-full h-full"
                                                            />
                                                        </div>
                                                        
                                                        <h4 className="text-gradient-gold font-bold text-lg mb-1 font-serif tracking-wide">
                                                            ACCESS PASS
                                                        </h4>
                                                        <p className="text-[10px] text-gray-500 font-mono mb-4">
                                                            {ticket.ticket_number}
                                                        </p>
                                                        
                                                        <div className="flex items-center gap-2 text-green-500 text-xs uppercase tracking-widest bg-green-900/20 px-3 py-2 rounded-full border border-green-500/20">
                                                            <ShieldCheck className="w-4 h-4" />
                                                            <span>Valid & Verified</span>
                                                        </div>

                                                        <p className="text-[10px] text-gray-600 mt-4 text-center">
                                                            Show this QR code at the entrance for validation
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            )}

            {activeTab === 'orders' && (
                <>
                    {myOrders.length === 0 ? (
                        <div className="glass-panel p-16 text-center rounded border border-white/5">
                            <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 font-serif">No active orders.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <AnimatePresence>
                                {myOrders.map(order => {
                                    const isReady = order.status === 'ready';
                                    const isCompleted = order.status === 'completed';

                                    return (
                                        <motion.div
                                            key={order.id}
                                            layout
                                            className={`glass-panel rounded-lg overflow-hidden relative border-t-4 ${isReady ? 'border-green-500' : 'border-yellow-600'}`}
                                        >
                                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                                            <div className="p-6 md:p-8 relative z-10">
                                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                                                    <div>
                                                        <h3 className="font-bold text-2xl font-serif text-white">Order #{order.id}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500 animate-bounce' : 'bg-yellow-500 animate-pulse'}`} />
                                                            <span className={`text-xs font-bold uppercase tracking-widest ${isReady ? 'text-green-400' : 'text-yellow-500'}`}>
                                                                {isReady ? 'Ready for Pickup' : order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono text-[10px] text-gray-600 border border-white/5 px-2 py-1 rounded self-start md:self-auto">
                                                        {new Date(order.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>

                                                <div className="mb-6 space-y-3 bg-black/30 p-4 rounded border border-white/5">
                                                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-widest mb-2">
                                                        <Package className="w-3 h-3" />
                                                        <span>Items in this order</span>
                                                    </div>
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm">
                                                            <span className="text-white">{item.serviceName}</span>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-gray-500">x{item.quantity}</span>
                                                                <span className="text-[#FFD700] text-xs">{item.avgTime}min</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {order.status === 'pending' && (
                                                    <div className="flex items-center gap-4 border-l-2 border-yellow-500/30 pl-4 py-2 bg-yellow-500/5 rounded-r">
                                                        <Clock className="w-8 h-8 text-yellow-500" />
                                                        <div>
                                                            <p className="text-[10px] text-yellow-500/70 uppercase tracking-widest">Estimated Wait</p>
                                                            <p className="font-bold text-2xl text-white">{order.estimatedWait} <span className="text-sm font-normal text-gray-500">mins</span></p>
                                                        </div>
                                                    </div>
                                                )}

                                                {isReady && !showNFT && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-center md:text-left py-2"
                                                    >
                                                        <button
                                                            onClick={() => setShowNFT(order.id)}
                                                            className="w-full md:w-auto btn-premium flex items-center justify-center gap-3 text-xs"
                                                        >
                                                            <QrCode className="w-5 h-5" />
                                                            REVEAL ACCESS TOKEN
                                                        </button>
                                                    </motion.div>
                                                )}

                                                {showNFT === order.id && (
                                                    <motion.div
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="bg-black border border-yellow-500/40 rounded p-6 mt-4 flex flex-col items-center justify-center relative shadow-[0_0_50px_rgba(212,175,55,0.15)]"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                                                        <div className="w-40 h-40 bg-white p-3 rounded mb-4 shadow-2xl">
                                                            <img
                                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.id}`}
                                                                alt="NFT QR"
                                                                className="w-full h-full"
                                                            />
                                                        </div>
                                                        <h4 className="text-gradient-gold font-bold text-xl mb-1 font-serif tracking-widest">VERIFIED ASSET</h4>
                                                        <p className="text-[10px] text-gray-500 font-mono tracking-widest">{order.id}-{Date.now()}</p>

                                                        <div className="mt-4 flex items-center gap-2 text-green-500 text-xs uppercase tracking-widest bg-green-900/20 px-3 py-1 rounded-full border border-green-500/20">
                                                            <ShieldCheck className="w-4 h-4" />
                                                            <span>Blockchain Verified</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ClientOrders;
