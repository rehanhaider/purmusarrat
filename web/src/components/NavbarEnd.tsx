import React, { useState, useEffect, useRef } from "react";
import { AuthService } from "@lib/auth";
import { $userInitials } from "@lib/stores/DefaultStore";

export const NavbarEnd: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authStatus = await AuthService.checkAuthStatus();
                setIsAuthenticated(authStatus);
            } catch (error) {
                console.error("Authentication check failed:", error);
                setIsAuthenticated(false);
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isAuthenticated) {
            e.preventDefault();
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
        }
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        try {
            await AuthService.logout();
            setIsAuthenticated(false);
            setIsDropdownOpen(false);
            window.location.href = "/";
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (isAuthenticated === null) {
        return <div className="h-8 w-8"></div>; // Placeholder with same size as avatar
    }

    return (
        <div className="flex h-full w-full items-center justify-center">
            {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                    <div className="avatar placeholder cursor-pointer" onClick={toggleDropdown}>
                        <div className="w-8 rounded-full bg-primary text-primary-content">
                            <span className="text-xs flex h-full w-full items-center justify-center">{$userInitials.get()}</span>
                        </div>
                    </div>
                    {isDropdownOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-48 rounded-box bg-base-100 shadow-xl">
                            <ul className="menu p-2">
                                <li>
                                    <a href="/settings">Settings</a>
                                </li>
                                <li>
                                    <a href="/logout" onClick={handleLogout}>
                                        Logout
                                    </a>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <a href="/login" className="btn btn-primary w-full text-sm" onClick={handleClick}>
                    Login
                </a>
            )}
        </div>
    );
};
