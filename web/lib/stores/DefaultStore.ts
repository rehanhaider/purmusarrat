import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistentMap } from "@nanostores/persistent";
import { computed } from "nanostores";
import type { UserAttributes, AuthResult } from "@lib/auth";

export const $user = persistentMap<UserAttributes>("user:", {
    email: "",
    given_name: "",
    family_name: "",
});

export const $tokens = persistentMap<AuthResult>("tokens:", {
    AccessToken: "",
    IdToken: "",
    RefreshToken: "",
});

export const $userInitials = computed($user, (user) => {
    return `${user.given_name[0]}${user.family_name[0]}`;
});

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
        },
    },
});

// Only run this code on the client side
if (typeof window !== "undefined") {
    const localStoragePersister = createSyncStoragePersister({
        storage: window.localStorage,
    });

    // This will persist the query client to localStorage
    // Actually this is magic
    persistQueryClient({
        queryClient,
        persister: localStoragePersister,
    });
}
