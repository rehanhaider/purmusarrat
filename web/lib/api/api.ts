import axios, { AxiosError } from "axios";
import { $tokens } from "@lib/stores/DefaultStore";
import config from "@root/config.json";

const BASE_API_URL = `https://api.${config.DOMAIN_NAME}`;

export class ApiService {
    static async post(endpoint: string, data: Record<string, unknown>, auth: boolean = true) {
        try {
            const response = await axios.post(`${BASE_API_URL}${endpoint}`, data, {
                headers: {
                    "Content-Type": "application/json",
                    ...(auth ? { Authorization: $tokens.get().IdToken as string } : {}),
                },
            });

            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw new Error(`API Error: ${error.response?.statusText}`);
            }
            throw new Error("An unexpected error occurred");
        }
    }

    static async get(endpoint: string, auth: boolean = true) {
        try {
            const response = await axios.get(`${BASE_API_URL}${endpoint}`, {
                headers: {
                    ...(auth ? { Authorization: $tokens.get().IdToken as string } : {}),
                },
            });
            console.log("GET RESPONSE", response.data);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw new Error(`API Error: ${error.response?.status}`);
            }
            throw new Error("An unexpected error occurred");
        }
    }
}
