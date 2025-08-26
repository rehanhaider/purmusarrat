import { type TokenPayload, type UserAttributes } from "./types";

export function parseJwt(token: string): TokenPayload {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
}

export function extractAttributesFromToken(token: string): UserAttributes {
    const payload = parseJwt(token);
    return {
        email: payload.email,
        given_name: payload.given_name,
        family_name: payload.family_name,
    };
}
