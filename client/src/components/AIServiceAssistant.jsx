import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Plus, Edit2, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://d4y2c4layjh2.cloudfront.net';

const AIServiceAssistant = () => {
  const { user } = useAuth();
  const { addService } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [editingService, setEditingService] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/service-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyId: user?.privyId,
          businessType: user?.profile?.businessCategory || user?.profile?.businessName || 'restaurant',
          businessCategory: user?.profile?.businessCategory || 'restaurant',
          businessName: user?.profile?.businessName || user?.name || 'Your Business'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = () => {
    setIsOpen(true);
    if (recommendations.length === 0) {
      fetchRecommendations();
    }
  };

  const handleAddService = async (service) => {
    const success = await addService({
      title: service.title,
      description: service.description,
      image: service.image,
      avgTime: service.avgTime,
      totalStock: service.totalStock,
      price: service.price || 0,
      schedule: service.schedule || {
        openTime: '09:00',
        closeTime: '18:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      }
    });
    
    if (success) {
      // Remove from recommendations
      setRecommendations(prev => prev.filter(r => r.title !== service.title));
    }
  };

  const handleEditService = (service) => {
    setEditingService({ ...service });
  };

  const handleSaveEdit = async () => {
    if (editingService) {
      await handleAddService(editingService);
      setEditingService(null);
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleGetRecommendations}
        className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:shadow-purple-500/50 transition-all duration-300"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="font-bold text-sm uppercase tracking-wider">AI Suggestions</span>
      </motion.button>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a] border border-[#333] max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#333] flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif text-white">AI Service Assistant</h2>
                    <p className="text-sm text-gray-400">Powered by AWS Bedrock</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                    <p className="text-gray-400 animate-pulse">Generating personalized recommendations...</p>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-20">
                    <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-6">Click the button to get AI-powered service suggestions</p>
                    <button
                      onClick={fetchRecommendations}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      Get Recommendations
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-serif text-white mb-2">Recommended Services for You</h3>
                      <p className="text-sm text-gray-400">Click "+" to add instantly, or "Edit" to customize first</p>
                    </div>

                    {recommendations.map((service, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-[#050505] border border-[#222] hover:border-purple-500/50 transition-all duration-300 overflow-hidden group"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Image */}
                          <div className="w-full md:w-48 h-48 overflow-hidden relative">
                            <img
                              src={service.image}
                              alt={service.title}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-6">
                            <h4 className="text-xl font-serif text-white mb-2">{service.title}</h4>
                            <p className="text-gray-400 text-sm mb-4">{service.description}</p>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Time</p>
                                <p className="text-white font-bold">{service.avgTime} min</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Stock</p>
                                <p className="text-white font-bold">{service.totalStock} slots</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Price</p>
                                <p className="text-[#FFD700] font-bold">${service.price}</p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => handleAddService(service)}
                                className="flex-1 bg-[#FFD700] text-black px-4 py-2 hover:bg-white transition-colors flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider"
                              >
                                <Plus className="w-4 h-4" />
                                Add Now
                              </button>
                              <button
                                onClick={() => handleEditService(service)}
                                className="px-4 py-2 border border-[#333] text-white hover:border-[#FFD700] hover:text-[#FFD700] transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {recommendations.length > 0 && (
                      <div className="text-center pt-4">
                        <button
                          onClick={fetchRecommendations}
                          className="text-purple-400 hover:text-purple-300 text-sm uppercase tracking-wider flex items-center gap-2 mx-auto"
                        >
                          <Sparkles className="w-4 h-4" />
                          Get More Suggestions
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setEditingService(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a] border border-[#333] max-w-2xl w-full p-6"
            >
              <h3 className="text-xl font-serif text-white mb-6">Customize Service</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 uppercase tracking-widest block mb-2">Title</label>
                  <input
                    type="text"
                    value={editingService.title}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="w-full bg-[#050505] border border-[#333] text-white px-4 py-2 focus:border-[#FFD700] outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 uppercase tracking-widest block mb-2">Description</label>
                  <textarea
                    value={editingService.description}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    className="w-full bg-[#050505] border border-[#333] text-white px-4 py-2 h-24 focus:border-[#FFD700] outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 uppercase tracking-widest block mb-2">Time (min)</label>
                    <input
                      type="number"
                      value={editingService.avgTime}
                      onChange={(e) => setEditingService({ ...editingService, avgTime: Number(e.target.value) })}
                      className="w-full bg-[#050505] border border-[#333] text-white px-4 py-2 focus:border-[#FFD700] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 uppercase tracking-widest block mb-2">Stock</label>
                    <input
                      type="number"
                      value={editingService.totalStock}
                      onChange={(e) => setEditingService({ ...editingService, totalStock: Number(e.target.value) })}
                      className="w-full bg-[#050505] border border-[#333] text-white px-4 py-2 focus:border-[#FFD700] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 uppercase tracking-widest block mb-2">Price</label>
                    <input
                      type="number"
                      value={editingService.price}
                      onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                      className="w-full bg-[#050505] border border-[#333] text-white px-4 py-2 focus:border-[#FFD700] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#FFD700] text-black px-6 py-3 hover:bg-white transition-colors font-bold uppercase tracking-wider"
                >
                  Add Service
                </button>
                <button
                  onClick={() => setEditingService(null)}
                  className="px-6 py-3 border border-[#333] text-white hover:border-[#FFD700] transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIServiceAssistant;

