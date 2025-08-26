import React, { useState } from "react";
import { AuthService, AuthError } from "@lib/auth";

const LoginForm: React.FC = () => {
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        try {
            const response = await AuthService.login(email, password);
            if (response) {
                setMessage({ text: "Login successful! Redirecting...", type: "success" });
                // Wait for 2 seconds before redirecting
                setTimeout(() => {
                    const returnUrl = new URLSearchParams(window.location.search).get("returnUrl");
                    window.location.href = returnUrl || "/";
                }, 2000);
            }
        } catch (error: any) {
            console.error(error);
            if (error instanceof AuthError) {
                if (error.code === "UserNotConfirmedException") {
                    setMessage({
                        text: `Email not verified. Please check your email for verification instructions. <br/><br/><a href="/resend?email=${encodeURIComponent(email)}" class="text-blue-500 hover:text-blue-600 hover:underline">Resend verification email</a>`,
                        type: "error",
                    });
                } else if (error.code === "UserNotFoundException" || error.code === "NotAuthorizedException") {
                    setMessage({ text: "Invalid email or password. Please try again.", type: "error" });
                } else {
                    setMessage({ text: error.message, type: "error" });
                }
            } else {
                setMessage({ text: "An unexpected error occurred. Please try again.", type: "error" });
            }
        }
    };

    return (
        <div className="m-auto w-96 rounded p-8 shadow-2xl" aria-labelledby="login-heading">
            <div className="mb-8 flex items-center justify-between py-4">
                <h2 id="login-heading" className="text-xl font-bold">
                    Login
                </h2>
                <div className="text-xs">
                    <span className="mr-2">Don&apos;t have an account?</span>
                    <a href="/signup" className="ml-1 text-blue-500 hover:text-blue-600 hover:underline">
                        Sign up
                    </a>
                </div>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-control">
                    <label htmlFor="email" className="sr-only">
                        {" "}
                        Email{" "}
                    </label>
                    <input
                        id="email"
                        type="text"
                        name="email"
                        placeholder="Email"
                        className="input input-bordered my-2 w-full max-w-xs"
                        required
                        aria-required="true"
                    />
                    <label htmlFor="password" className="sr-only">
                        {" "}
                        Password{" "}
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="Password"
                        className="input input-bordered my-2 w-full max-w-xs"
                        required
                        aria-required="true"
                    />
                    <div className="text-right">
                        <a href="/forgot" className="mt-2 text-sm text-blue-500 hover:text-blue-600 hover:underline">
                            Forgot password?
                        </a>
                    </div>
                </div>
                {message.text && (
                    <div
                        className={`mt-2 text-sm ${message.type === "error" ? "text-red-500" : "text-green-500"}`}
                        dangerouslySetInnerHTML={{ __html: message.text }}
                    ></div>
                )}
                <div className="mt-4">
                    <button type="submit" className="btn btn-primary w-full">
                        {" "}
                        Log in{" "}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;
