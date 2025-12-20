module ticketchain::admin_registry {
    use std::signer;
    use std::vector;
    use aptos_framework::event;

    const E_NOT_SUPERADMIN: u64 = 1;
    const E_ALREADY_ADMIN: u64 = 2;
    const E_NOT_ADMIN: u64 = 3;
    const E_REGISTRY_NOT_INITIALIZED: u64 = 4;
    const E_CANNOT_REMOVE_SUPERADMIN: u64 = 5;

    struct AdminRegistry has key {
        superadmin: address,
        admins: vector<address>,
    }

    #[event]
    struct AdminAdded has drop, store {
        admin: address,
        added_by: address,
    }

    #[event]
    struct AdminRemoved has drop, store {
        admin: address,
        removed_by: address,
    }

    public entry fun initialize(superadmin: &signer) {
        let superadmin_addr = signer::address_of(superadmin);
        
        let admins = vector::empty<address>();
        vector::push_back(&mut admins, superadmin_addr);
        
        move_to(superadmin, AdminRegistry {
            superadmin: superadmin_addr,
            admins,
        });
    }

    public entry fun add_admin(
        caller: &signer,
        registry_address: address,
        new_admin: address
    ) acquires AdminRegistry {
        let caller_addr = signer::address_of(caller);
        let registry = borrow_global_mut<AdminRegistry>(registry_address);
        
        assert!(caller_addr == registry.superadmin, E_NOT_SUPERADMIN);
        assert!(!is_admin_internal(&registry.admins, new_admin), E_ALREADY_ADMIN);
        
        vector::push_back(&mut registry.admins, new_admin);
        
        event::emit(AdminAdded {
            admin: new_admin,
            added_by: caller_addr,
        });
    }

    public entry fun remove_admin(
        caller: &signer,
        registry_address: address,
        admin_to_remove: address
    ) acquires AdminRegistry {
        let caller_addr = signer::address_of(caller);
        let registry = borrow_global_mut<AdminRegistry>(registry_address);
        
        assert!(caller_addr == registry.superadmin, E_NOT_SUPERADMIN);
        assert!(admin_to_remove != registry.superadmin, E_CANNOT_REMOVE_SUPERADMIN);
        assert!(is_admin_internal(&registry.admins, admin_to_remove), E_NOT_ADMIN);
        
        let (found, index) = vector::index_of(&registry.admins, &admin_to_remove);
        if (found) {
            vector::remove(&mut registry.admins, index);
        };
        
        event::emit(AdminRemoved {
            admin: admin_to_remove,
            removed_by: caller_addr,
        });
    }

    #[view]
    public fun is_admin(registry_address: address, addr: address): bool acquires AdminRegistry {
        if (!exists<AdminRegistry>(registry_address)) {
            return false
        };
        let registry = borrow_global<AdminRegistry>(registry_address);
        is_admin_internal(&registry.admins, addr)
    }

    #[view]
    public fun is_superadmin(registry_address: address, addr: address): bool acquires AdminRegistry {
        if (!exists<AdminRegistry>(registry_address)) {
            return false
        };
        let registry = borrow_global<AdminRegistry>(registry_address);
        registry.superadmin == addr
    }

    #[view]
    public fun get_all_admins(registry_address: address): vector<address> acquires AdminRegistry {
        let registry = borrow_global<AdminRegistry>(registry_address);
        let result = vector::empty<address>();
        let len = vector::length(&registry.admins);
        let i = 0;
        while (i < len) {
            vector::push_back(&mut result, *vector::borrow(&registry.admins, i));
            i = i + 1;
        };
        result
    }

    fun is_admin_internal(admins: &vector<address>, addr: address): bool {
        let len = vector::length(admins);
        let i = 0;
        while (i < len) {
            if (*vector::borrow(admins, i) == addr) {
                return true
            };
            i = i + 1;
        };
        false
    }
}
