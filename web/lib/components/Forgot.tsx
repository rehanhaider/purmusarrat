import React, { useState } from "react";
import { AuthService, AuthError } from "@lib/auth/index.ts";
import OtpInput from "./OtpInput.tsx"; // Make sure to import the OtpInput component

const passwordRegex = {
    minLength: /.{8,}/,
    maxLength: /^.{0,16}$/,
    upperCase: /[A-Z]/,
    number: /[0-9]/,
    specialChar: /[!@#$%^&*]/,
};

const ForgotForm: React.FC = () => {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" as "success" | "error" | "" });
    const [showConfirmForm, setShowConfirmForm] = useState(false);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await AuthService.forgotPassword(email);
            setMessage({ text: "Password reset email sent. Check your inbox for the confirmation code.", type: "success" });
            setShowConfirmForm(true);
        } catch (error: any) {
            setMessage({ text: error instanceof AuthError ? error.message : "An error occurred. Please try again.", type: "error" });
        }
    };

    const handleConfirmPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setMessage({ text: "Passwords do not match. Please try again.", type: "error" });
            return;
        }

        if (code.length !== 6) {
            setMessage({ text: "Please enter a valid 6-digit confirmation code.", type: "error" });
            return;
        }

        try {
            await AuthService.confirmForgotPassword(email, code, newPassword);
            setMessage({ text: "Password reset successful. You can now log in with your new password.", type: "success" });
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        } catch (error: any) {
            setMessage({ text: error instanceof AuthError ? error.message : "An error occurred. Please try again.", type: "error" });
        }
    };

    const updatePasswordChecks = () => {
        let checksHtml = "";
        Object.entries(passwordRegex).forEach(([key, regex]) => {
            const isValid = regex.test(newPassword);
            const symbol = isValid ? "✓" : "✗";
            const color = isValid ? "text-green-500" : "text-red-500";
            const label =
                key === "minLength"
                    ? "At least 8 characters"
                    : key === "maxLength"
                      ? "At most 16 characters"
                      : key === "upperCase"
                        ? "Contains uppercase letter"
                        : key === "number"
                          ? "Contains number"
                          : "Contains special character (!@#$%^&*)";

            checksHtml += `<li class="${color}">${symbol} ${label}</li>`;
        });
        return <ul dangerouslySetInnerHTML={{ __html: checksHtml }} />;
    };

    return (
        <div className="m-auto w-96 rounded p-8 shadow-2xl" aria-labelledby="forgot-password-heading">
            <h2 id="forgot-password-heading" className="mb-4 text-xl font-bold">
                Forgot Password
            </h2>
            {!showConfirmForm ? (
                <form onSubmit={handleForgotPassword}>
                    <div className="form-control">
                        <label htmlFor="email" className="sr-only">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="input input-bordered my-2 w-full max-w-xs"
                            required
                            aria-required="true"
                        />
                    </div>
                    {message.text && (
                        <div className={`mt-2 text-sm ${message.type === "error" ? "text-red-500" : "text-green-500"}`}>{message.text}</div>
                    )}
                    <div className="mt-4">
                        <button type="submit" className="btn btn-primary w-full">
                            Reset Password
                        </button>
                    </div>
                </form>
            ) : (
                <div>
                    <h3 className="mb-2 text-lg font-semibold">Confirm New Password</h3>
                    <div className="form-control">
                        <label htmlFor="email" className="mb-2 block text-sm font-medium">
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
                    <form onSubmit={handleConfirmPassword}>
                        <div className="form-control">
                            <label htmlFor="code" className="mb-2 block text-sm font-medium">
                                Confirmation Code
                            </label>
                            <OtpInput
                                value={code}
                                onChange={setCode}
                                size={6}
                                validationPattern={/[0-9]{1}/}
                                className="input input-bordered h-10 w-10"
                            />
                            <label htmlFor="new-password" className="mb-2 mt-4 block text-sm font-medium">
                                New Password
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New Password"
                                className="input input-bordered my-2 w-full max-w-xs"
                                required
                                aria-required="true"
                            />
                            {newPassword && <div className="mt-2 text-xs">{updatePasswordChecks()}</div>}
                            <label htmlFor="confirm-new-password" className="mb-2 mt-4 block text-sm font-medium">
                                Confirm New Password
                            </label>
                            <input
                                id="confirm-new-password"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="Confirm New Password"
                                className="input input-bordered my-2 w-full max-w-xs"
                                required
                                aria-required="true"
                            />
                            {confirmNewPassword && newPassword !== confirmNewPassword && (
                                <div className="mt-2 text-xs text-red-500">✗ Passwords do not match</div>
                            )}
                        </div>
                        {message.text && (
                            <div className={`mt-2 text-sm ${message.type === "error" ? "text-red-500" : "text-green-500"}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="mt-4">
                            <button type="submit" className="btn btn-primary w-full">
                                Confirm New Password
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <div className="mt-4 text-center">
                <a href="/login" className="text-sm text-blue-500 hover:text-blue-600 hover:underline">
                    Back to Login
                </a>
            </div>
        </div>
    );
};

export default ForgotForm;
