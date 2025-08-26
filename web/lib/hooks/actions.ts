import { AuthService } from "@lib/auth";

export const redirectIfUnauthenticated = (path: string) => {
    document.addEventListener("DOMContentLoaded", () => {
        if (!AuthService.isAuthenticated()) {
            window.location.href = `/login?returnUrl=${path}`;
        }
    });
};
