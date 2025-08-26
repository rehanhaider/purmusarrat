import React, { useState, useEffect } from "react";
import { AuthService, AuthError } from "@lib/auth";

const COOLDOWN_TIME = 180; // 180 seconds (3 minutes)

const ResendForm: React.FC = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" as "success" | "error" | "" });
    const [cooldownTime, setCooldownTime] = useState(0);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get("email");
        if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
        }

        const storedTimestamp = localStorage.getItem("lastResendTime");
        if (storedTimestamp) {
            const elapsedTime = (Date.now() - parseInt(storedTimestamp)) / 1000;
            if (elapsedTime < COOLDOWN_TIME) {
                setCooldownTime(Math.ceil(COOLDOWN_TIME - elapsedTime));
            }
        }
    }, []);

    useEffect(() => {
        let timer: number;
        if (cooldownTime > 0) {
            timer = window.setInterval(() => {
                setCooldownTime((prevTime) => prevTime - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [cooldownTime]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (cooldownTime > 0) {
            setMessage({ text: `Please wait ${cooldownTime} seconds before requesting another email.`, type: "error" });
            return;
        }

        try {
            await AuthService.resendVerificationCode(email);
            setMessage({ text: "Verification email sent successfully. Please check your inbox.", type: "success" });
            setCooldownTime(COOLDOWN_TIME);
            localStorage.setItem("lastResendTime", Date.now().toString());
        } catch (error: any) {
            setMessage({
                text: error instanceof AuthError ? error.message : "An error occurred. Please try again.",
                type: "error",
            });
        }
    };

    return (
        <div className="m-auto w-96 rounded p-8 shadow-2xl" aria-labelledby="resend-heading">
            <h2 id="resend-heading" className="mb-4 text-xl font-bold">
                Resend Verification Email
            </h2>
            <form onSubmit={handleSubmit}>
                <div className="form-control">
                    <label htmlFor="email" className="sr-only">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        className="input input-bordered input-ghost my-2 w-full max-w-xs"
                        required
                        aria-required="true"
                        readOnly
                    />
                </div>
                {message.text && (
                    <div className={`mt-2 text-sm ${message.type === "error" ? "text-red-500" : "text-green-500"}`}>{message.text}</div>
                )}
                <div className="mt-4">
                    <button type="submit" className="btn btn-primary w-full" disabled={cooldownTime > 0}>
                        {cooldownTime > 0 ? `Resend Verification Email (${cooldownTime}s)` : "Resend Verification Email"}
                    </button>
                </div>
            </form>
            <div className="mt-4 text-center">
                <a href="/login" className="text-sm text-blue-500 hover:text-blue-600 hover:underline">
                    Go back to login
                </a>
            </div>
        </div>
    );
};

export default ResendForm;
