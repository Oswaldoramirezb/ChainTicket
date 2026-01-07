import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Utensils, Wine, Users, Sparkles, ShoppingCart, Check } from 'lucide-react';

const BUSINESS_CATEGORIES = [
    {
        id: 'SUPERMARKET',
        label: 'Supermarket',
        description: 'Grocery store with products and queue management',
        icon: ShoppingCart,
        color: 'green'
    },
    {
        id: 'RESTAURANT',
        label: 'Restaurant',
        description: 'Dining with reservations and menu options',
        icon: Utensils,
        color: 'orange'
    },
    {
        id: 'BAR',
        label: 'Bar & Lounge',
        description: 'Drinks and experiences with reservations',
        icon: Wine,
        color: 'purple'
    },
    {
        id: 'SOCIAL_EVENTS',
        label: 'Social Events',
        description: 'Concerts, conferences, and special events',
        icon: Users,
        color: 'blue'
    },
    {
        id: 'SPA',
        label: 'Spa & Wellness',
        description: 'Spa services and wellness treatments',
        icon: Sparkles,
        color: 'pink'
    },
    {
        id: 'QUEUE',
        label: 'General Queue',
        description: 'Simple queue management for any business',
        icon: Store,
        color: 'gray'
    }
];

const BusinessCategorySelector = ({ currentCategory, onSelect, disabled = false }) => {
    const [selected, setSelected] = useState(currentCategory);

    const handleSelect = (categoryId) => {
        if (disabled) return;
        setSelected(categoryId);
        onSelect(categoryId);
    };

    const getColorClasses = (color, isSelected) => {
        const colors = {
            green: isSelected ? 'bg-green-500/20 border-green-500' : 'border-green-500/30 hover:border-green-500',
            orange: isSelected ? 'bg-orange-500/20 border-orange-500' : 'border-orange-500/30 hover:border-orange-500',
            purple: isSelected ? 'bg-purple-500/20 border-purple-500' : 'border-purple-500/30 hover:border-purple-500',
            blue: isSelected ? 'bg-blue-500/20 border-blue-500' : 'border-blue-500/30 hover:border-blue-500',
            pink: isSelected ? 'bg-pink-500/20 border-pink-500' : 'border-pink-500/30 hover:border-pink-500',
            gray: isSelected ? 'bg-gray-500/20 border-gray-500' : 'border-gray-500/30 hover:border-gray-500'
        };
        return colors[color] || colors.gray;
    };

    const getIconColor = (color) => {
        const colors = {
            green: 'text-green-500',
            orange: 'text-orange-500',
            purple: 'text-purple-500',
            blue: 'text-blue-500',
            pink: 'text-pink-500',
            gray: 'text-gray-500'
        };
        return colors[color] || colors.gray;
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold text-white mb-2">Select Your Business Category</h3>
                <p className="text-sm text-gray-400">Choose the category that best describes your business</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BUSINESS_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selected === category.id;

                    return (
                        <motion.button
                            key={category.id}
                            onClick={() => handleSelect(category.id)}
                            disabled={disabled}
                            whileHover={{ scale: disabled ? 1 : 1.02 }}
                            whileTap={{ scale: disabled ? 1 : 0.98 }}
                            className={`
                                relative p-6 rounded-lg border-2 transition-all
                                ${getColorClasses(category.color, isSelected)}
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                bg-black/30
                            `}
                        >
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-3 right-3 w-6 h-6 bg-[#FFD700] rounded-full flex items-center justify-center"
                                >
                                    <Check className="w-4 h-4 text-black" />
                                </motion.div>
                            )}

                            <div className={`w-12 h-12 rounded-full ${isSelected ? 'bg-black/50' : 'bg-white/5'} flex items-center justify-center mb-4`}>
                                <Icon className={`w-6 h-6 ${getIconColor(category.color)}`} />
                            </div>

                            <h4 className="text-white font-bold text-left mb-2">{category.label}</h4>
                            <p className="text-gray-400 text-xs text-left">{category.description}</p>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default BusinessCategorySelector;

