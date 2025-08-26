import { z } from "zod";
import {
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    GlobalSignOutCommand,
    AuthFlowType,
    ResendConfirmationCodeCommand,
    ChangePasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, CLIENT_ID } from "./config";
import { extractAttributesFromToken, parseJwt } from "./utils";
import { AuthError, ValidationError } from "./errors";
import { type User, UserSchema, type AuthResult } from "./types";
import { $tokens, $user } from "@lib/stores/DefaultStore";

export class AuthService {
    static async login(email: string, password: string): Promise<AuthResult> {
        try {
            const command = new InitiateAuthCommand({
                AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
                ClientId: CLIENT_ID,
                AuthParameters: { USERNAME: email, PASSWORD: password },
            });

            const response = await cognitoClient.send(command);
            const result = response.AuthenticationResult;

            if (result?.AccessToken && result.IdToken && result.RefreshToken) {
                $tokens.set({
                    AccessToken: result.AccessToken,
                    RefreshToken: result.RefreshToken,
                    IdToken: result.IdToken,
                });
                $user.set(extractAttributesFromToken(result.IdToken));
                return result;
            }
            throw new AuthError("Incomplete authentication result", "IncompleteAuthResult");
        } catch (error: any) {
            console.log(error);
            if (error.name === "UserNotConfirmedException") {
                throw new AuthError("User not confirmed", "UserNotConfirmedException");
            } else if (error.name === "UserNotFoundException" || error.name === "NotAuthorizedException") {
                throw new AuthError("Invalid email or password", error.name);
            } else {
                throw new AuthError(error.message, error.name);
            }
        }
    }

    static async signUp(user: User, recaptchaToken: string): Promise<void> {
        try {
            console.log(user);
            UserSchema.parse(user);
            const command = new SignUpCommand({
                ClientId: CLIENT_ID,
                Username: user.email,
                Password: user.password,
                UserAttributes: [
                    { Name: "email", Value: user.email },
                    { Name: "given_name", Value: user.firstName },
                    { Name: "family_name", Value: user.lastName },
                ],
                ValidationData: [{ Name: "recaptchaToken", Value: recaptchaToken }],
            });
            await cognitoClient.send(command);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                throw new ValidationError(error.errors.map((e) => e.message).join(", "));
            }
            throw new AuthError(error.message, error.name);
        }
    }

    static async confirmSignUp(email: string, code: string): Promise<void> {
        try {
            const command = new ConfirmSignUpCommand({
                ClientId: CLIENT_ID,
                Username: email,
                ConfirmationCode: code,
            });
            await cognitoClient.send(command);
        } catch (error: any) {
            throw new AuthError(error.message, error.name);
        }
    }

    static async forgotPassword(email: string): Promise<void> {
        try {
            const command = new ForgotPasswordCommand({
                ClientId: CLIENT_ID,
                Username: email,
            });
            await cognitoClient.send(command);
        } catch (error: any) {
            throw new AuthError(error.message, error.name);
        }
    }

    static async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
        try {
            const command = new ConfirmForgotPasswordCommand({
                ClientId: CLIENT_ID,
                Username: email,
                ConfirmationCode: code,
                Password: newPassword,
            });
            await cognitoClient.send(command);
        } catch (error: any) {
            throw new AuthError(error.message, error.name);
        }
    }

    static async logout(): Promise<void> {
        try {
            const accessToken = $tokens.get().AccessToken;
            if (!accessToken) throw new AuthError("No access token found", "NoAccessToken");

            const command = new GlobalSignOutCommand({ AccessToken: accessToken });
            await cognitoClient.send(command);
            $tokens.set({});
            $user.set({
                email: "",
                given_name: "",
                family_name: "",
            });
        } catch (error: any) {
            throw new AuthError(error.message, error.name);
        }
    }

    static isAuthenticated(): boolean {
        const accessToken = $tokens.get().AccessToken;
        const refreshToken = $tokens.get().RefreshToken;

        if (!accessToken || !refreshToken) return false;

        const decodedToken = parseJwt(accessToken);
        return decodedToken.exp > Date.now() / 1000;
    }

    static async refreshSession(): Promise<AuthResult> {
        try {
            const refreshToken = $tokens.get().RefreshToken;
            if (!refreshToken) throw new AuthError("No refresh token found", "NoRefreshToken");

            const command = new InitiateAuthCommand({
                AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
                ClientId: CLIENT_ID,
                AuthParameters: { REFRESH_TOKEN: refreshToken },
            });

            const response = await cognitoClient.send(command);
            const result = response.AuthenticationResult;

            if (result?.AccessToken && result.IdToken) {
                $tokens.setKey("AccessToken", result.AccessToken);
                $tokens.setKey("IdToken", result.IdToken);
                return result;
            }
            throw new AuthError("Incomplete refresh result", "IncompleteRefreshResult");
        } catch (error: any) {
            throw new AuthError(error.message, error.name);
        }
    }

    static async checkAuthStatus(): Promise<boolean> {
        if (this.isAuthenticated()) {
            return true;
        }

        try {
            const refreshed = await this.refreshSession();
            return !!refreshed;
        } catch (error) {
            console.log("Session refresh failed:", error);
            return false;
        }
    }

    static async resendVerificationCode(email: string): Promise<void> {
        try {
            const command = new ResendConfirmationCodeCommand({
                ClientId: CLIENT_ID,
                Username: email,
            });
            await cognitoClient.send(command);
        } catch (error: any) {
            throw new AuthError(error.message, error.name);
        }
    }

    static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        try {
            const accessToken = $tokens.get().AccessToken;
            if (!accessToken) {
                throw new AuthError("No access token found", "NoAccessToken");
            }

            const command = new ChangePasswordCommand({
                AccessToken: accessToken,
                PreviousPassword: oldPassword,
                ProposedPassword: newPassword,
            });

            await cognitoClient.send(command);
        } catch (error: any) {
            if (error.name === "InvalidPasswordException") {
                throw new AuthError("Invalid password format", error.name);
            } else if (error.name === "NotAuthorizedException") {
                throw new AuthError("Incorrect old password", error.name);
            } else {
                throw new AuthError(error.message, error.name);
            }
        }
    }
}
