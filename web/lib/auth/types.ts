import { z } from "zod";

export enum TokenType {
    Access = "access",
    Refresh = "refresh",
    Id = "id",
}

export interface TokenPayload {
    exp: number;
    [key: string]: any;
}

export type AuthResult = {
    AccessToken?: string;
    IdToken?: string;
    RefreshToken?: string;
};

export const UserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    password: z.string().min(8),
});

export type UserAttributes = {
    email: string;
    given_name: string;
    family_name: string;
    [key: string]: string;
};

export type User = z.infer<typeof UserSchema>;
