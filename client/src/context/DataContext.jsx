import { createContext, useContext, useState, useCallback } from 'react';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

// Multiple Vendors/Establishments
const VENDORS = [
    { id: 1, name: 'Golden Bar & Lounge', type: 'Bar', image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=2574&auto=format&fit=crop' },
    { id: 2, name: 'Premium Steakhouse', type: 'Restaurant', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop' },
    { id: 3, name: 'Artisan Coffee Co.', type: 'Coffee', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2678&auto=format&fit=crop' },
    { id: 4, name: 'Elite Events', type: 'Social Event', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2670&auto=format&fit=crop' },
];

// Services by Vendor
const INITIAL_SERVICES = [
    // Golden Bar & Lounge
    { id: 1, vendorId: 1, title: 'VIP Table Service', image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=2574&auto=format&fit=crop', avgTime: 15, totalStock: 50, sold: 12, isActive: true, schedule: { openTime: '18:00', closeTime: '02:00', days: ['Thu', 'Fri', 'Sat'] } },
    { id: 2, vendorId: 1, title: 'Bottle Service Premium', image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2669&auto=format&fit=crop', avgTime: 5, totalStock: 100, sold: 45, isActive: true, schedule: { openTime: '20:00', closeTime: '04:00', days: ['Fri', 'Sat'] } },
    { id: 3, vendorId: 1, title: 'Cocktail Masterclass', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2670&auto=format&fit=crop', avgTime: 30, totalStock: 20, sold: 8, isActive: true, schedule: { openTime: '17:00', closeTime: '20:00', days: ['Sat', 'Sun'] } },

    // Premium Steakhouse
    { id: 4, vendorId: 2, title: 'Wagyu Steak Experience', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=2670&auto=format&fit=crop', avgTime: 45, totalStock: 30, sold: 15, isActive: true, schedule: { openTime: '18:00', closeTime: '23:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] } },
    { id: 5, vendorId: 2, title: 'Chef\'s Tasting Menu', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2670&auto=format&fit=crop', avgTime: 60, totalStock: 25, sold: 10, isActive: true, schedule: { openTime: '19:00', closeTime: '22:00', days: ['Fri', 'Sat'] } },
    { id: 6, vendorId: 2, title: 'Wine Pairing Dinner', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2670&auto=format&fit=crop', avgTime: 50, totalStock: 20, sold: 5, isActive: false, schedule: { openTime: '19:00', closeTime: '23:00', days: ['Sat'] } },

    // Artisan Coffee Co.
    { id: 7, vendorId: 3, title: 'Specialty Pour Over', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop', avgTime: 8, totalStock: 100, sold: 60, isActive: true, schedule: { openTime: '07:00', closeTime: '18:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] } },
    { id: 8, vendorId: 3, title: 'Latte Art Workshop', image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=2574&auto=format&fit=crop', avgTime: 25, totalStock: 15, sold: 7, isActive: true, schedule: { openTime: '10:00', closeTime: '14:00', days: ['Sat', 'Sun'] } },
    { id: 9, vendorId: 3, title: 'Cold Brew Flight', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=2669&auto=format&fit=crop', avgTime: 5, totalStock: 80, sold: 40, isActive: true, schedule: { openTime: '08:00', closeTime: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] } },

    // Elite Events - Social Events
    { id: 10, vendorId: 4, title: 'VIP Gala Night', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2670&auto=format&fit=crop', avgTime: 180, totalStock: 200, sold: 75, isActive: true, schedule: { openTime: '20:00', closeTime: '03:00', days: ['Sat'] } },
    { id: 11, vendorId: 4, title: 'Exclusive Networking Party', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2669&auto=format&fit=crop', avgTime: 120, totalStock: 150, sold: 45, isActive: true, schedule: { openTime: '18:00', closeTime: '22:00', days: ['Thu', 'Fri'] } },
    { id: 12, vendorId: 4, title: 'Private Concert Access', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2670&auto=format&fit=crop', avgTime: 240, totalStock: 500, sold: 320, isActive: true, schedule: { openTime: '19:00', closeTime: '23:00', days: ['Fri', 'Sat'] } },
    { id: 13, vendorId: 4, title: 'Art Exhibition Opening', image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?q=80&w=2670&auto=format&fit=crop', avgTime: 90, totalStock: 100, sold: 28, isActive: true, schedule: { openTime: '11:00', closeTime: '20:00', days: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'] } },
];

export const DataProvider = ({ children }) => {
    const [vendors] = useState(VENDORS);
    const [services, setServices] = useState(INITIAL_SERVICES);
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);

    const updateService = (id, updates) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const addService = (newService, isGuest = false) => {
        setServices(prev => [...prev, { 
            ...newService, 
            id: Date.now(), 
            sold: 0, 
            isActive: isGuest ? false : true,
            isGuestCreated: isGuest,
            schedule: newService.schedule || { openTime: '09:00', closeTime: '18:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }
        }]);
    };

    const deleteService = (id) => {
        setServices(prev => prev.filter(s => s.id !== id));
    };

    const toggleServiceActive = (id, isGuest = false) => {
        if (isGuest) {
            console.warn('Guests cannot activate services. Please sign in first.');
            return false;
        }
        setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
        return true;
    };

    const addToCart = (serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (!service || service.sold >= service.totalStock || !service.isActive) return null;

        setCart(prev => {
            const existing = prev.find(item => item.serviceId === serviceId);
            if (existing) {
                return prev.map(item =>
                    item.serviceId === serviceId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { serviceId, quantity: 1, service }];
        });
    };

    const removeFromCart = (serviceId) => {
        setCart(prev => prev.filter(item => item.serviceId !== serviceId));
    };

    const updateCartQuantity = (serviceId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(serviceId);
            return;
        }
        setCart(prev => prev.map(item =>
            item.serviceId === serviceId ? { ...item, quantity } : item
        ));
    };

    const clearCart = () => setCart([]);

    const createOrderFromCart = () => {
        if (cart.length === 0) return null;

        const maxTime = Math.max(...cart.map(item => item.service.avgTime));

        cart.forEach(item => {
            updateService(item.serviceId, {
                sold: item.service.sold + item.quantity
            });
        });

        const newOrder = {
            id: `ORD-${Date.now().toString().slice(-6)}`,
            items: cart.map(item => ({
                serviceId: item.serviceId,
                serviceName: item.service.title,
                quantity: item.quantity,
                avgTime: item.service.avgTime
            })),
            status: 'pending',
            timestamp: Date.now(),
            estimatedWait: maxTime
        };

        setOrders(prev => [...prev, newOrder]);
        clearCart();
        return newOrder;
    };

    return (
        <DataContext.Provider value={{
            vendors,
            services,
            orders,
            cart,
            updateService,
            addService,
            deleteService,
            toggleServiceActive,
            addToCart,
            removeFromCart,
            updateCartQuantity,
            clearCart,
            createOrderFromCart,
            setOrders
        }}>
            {children}
        </DataContext.Provider>
    );
};
