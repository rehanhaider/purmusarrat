// import { TokenType } from "./types";

// export class TokenStorage {
//     static setToken(type: TokenType, token: string): void {
//         if (typeof window !== "undefined") {
//             localStorage.setItem(`token_${type}`, token);
//         }
//     }

//     static getToken(type: TokenType): string | null {
//         if (typeof window !== "undefined") {
//             return localStorage.getItem(`token_${type}`);
//         }
//         return null;
//     }

//     static removeToken(type: TokenType): void {
//         if (typeof window !== "undefined") {
//             localStorage.removeItem(`token_${type}`);
//         }
//     }

//     static clearTokens(): void {
//         Object.values(TokenType).forEach(this.removeToken);
//     }
// }
