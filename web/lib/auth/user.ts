import { AuthService, AuthError } from "./index";
import { extractAttributesFromToken } from "./utils";
import { UpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient } from "./config";
import { $tokens, $user } from "@lib/stores/DefaultStore";
import { type UserAttributes } from "./types";

export class UserService {
    static async getUserAttributes(): Promise<UserAttributes> {
        const idToken = $tokens.get().IdToken;
        const accessToken = $tokens.get().AccessToken;
        if (idToken && accessToken && AuthService.isAuthenticated()) {
            const storedAttributes = this.getStoredAttributes();
            if (storedAttributes) {
                return storedAttributes;
            }
        }

        try {
            await AuthService.refreshSession();
            const newIdToken = $tokens.get().IdToken;
            if (!newIdToken) {
                throw new AuthError("Failed to refresh session", "RefreshFailed");
            }
            const attributes = extractAttributesFromToken(newIdToken);
            this.storeAttributes(attributes);
            return attributes;
        } catch (error) {
            throw new AuthError("Failed to get user attributes", "GetAttributesFailed");
        }
    }

    static async updateUserAttributes(attributes: Partial<UserAttributes>): Promise<void> {
        const accessToken = $tokens.get().AccessToken;
        if (!accessToken) {
            throw new AuthError("No access token found", "NoAccessToken");
        }

        try {
            const command = new UpdateUserAttributesCommand({
                AccessToken: accessToken,
                UserAttributes: Object.entries(attributes)
                    .filter(([, value]) => value !== undefined)
                    .map(([Name, Value]) => ({ Name, Value: Value as string })),
            });

            await cognitoClient.send(command);

            // Update stored attributes
            const currentAttributes = await this.getUserAttributes();
            const updatedAttributes: UserAttributes = { ...currentAttributes };

            // Only update attributes that are not undefined
            Object.entries(attributes).forEach(([key, value]) => {
                if (value !== undefined) {
                    updatedAttributes[key] = value;
                }
            });

            this.storeAttributes(updatedAttributes);
        } catch (error: any) {
            throw new AuthError(error.message, error.name);
        }
    }

    private static storeAttributes(attributes: UserAttributes): void {
        if (typeof window !== "undefined") {
            $user.set(attributes);
        }
    }

    private static getStoredAttributes(): UserAttributes | null {
        if (typeof window !== "undefined") {
            return $user.get();
        }
        return null;
    }
}
