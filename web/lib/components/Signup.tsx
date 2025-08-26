import React, { useState, useEffect } from "react";
import { AuthService, type User, AuthError, ValidationError } from "@lib/auth";
import { loadRecaptcha, getRecaptchaToken } from "@lib/hooks/recapatcha";

const SignupForm: React.FC = () => {
    const [formData, setFormData] = useState<User>({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordChecks, setPasswordChecks] = useState<Record<string, boolean>>({});
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [isFormValid, setIsFormValid] = useState(false);

    const passwordRegex = {
        minLength: /.{8,}/,
        maxLength: /^.{0,16}$/,
        upperCase: /[A-Z]/,
        number: /[0-9]/,
        specialChar: /[!@#$%^&*]/,
    };

    useEffect(() => {
        updatePasswordChecks();
    }, [formData.password]);

    useEffect(() => {
        checkPasswordMatch();
    }, [formData.password, confirmPassword]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (successMessage && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            window.location.href = "/login";
        }
        return () => clearInterval(timer);
    }, [successMessage, countdown]);

    useEffect(() => {
        const allPasswordChecksPassed = Object.values(passwordChecks).every((check) => check);
        const isValid = Boolean(allPasswordChecksPassed && passwordMatch && formData.firstName && formData.lastName && formData.email);
        setIsFormValid(isValid);
    }, [passwordChecks, passwordMatch, formData]);

    const updatePasswordChecks = () => {
        const checks: Record<string, boolean> = {};
        Object.entries(passwordRegex).forEach(([key, regex]) => {
            checks[key] = regex.test(formData.password);
        });
        setPasswordChecks(checks);
    };

    const checkPasswordMatch = () => {
        setPasswordMatch(formData.password === confirmPassword);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "confirmPassword") {
            setConfirmPassword(value);
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    useEffect(() => {
        // Load the reCAPTCHA script
        loadRecaptcha();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        // Check if all password requirements are met
        const allPasswordChecksPassed = Object.values(passwordChecks).every((check) => check);

        if (!allPasswordChecksPassed) {
            setErrorMessage("Password does not meet all requirements");
            return;
        }

        if (formData.password !== confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const token = await getRecaptchaToken();
            await AuthService.signUp(formData, token);
            setSuccessMessage(true);
        } catch (error) {
            if (error instanceof ValidationError) {
                setErrorMessage(error.message);
            } else if (error instanceof AuthError) {
                setErrorMessage(`Authentication error: ${error.message}`);
            } else {
                setErrorMessage("An unexpected error occurred. Please try again.");
            }
            console.error("Signup error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="m-auto w-96 rounded p-8 shadow-2xl" aria-labelledby="signup-heading">
            <div className="mb-8 flex items-center justify-between py-4">
                <h2 id="signup-heading" className="text-xl font-bold">
                    Signup
                </h2>
                <div className="ml-auto text-xs">
                    <span>Already have an account?</span>
                    <a href="/login" className="ml-1 text-blue-500 hover:text-blue-600 hover:underline">
                        {" "}
                        Log in{" "}
                    </a>
                </div>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="flex">
                    <div className="mr-2 flex-1">
                        <label htmlFor="firstName" className="sr-only">
                            First Name
                        </label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            placeholder="First name"
                            className="input input-bordered my-2 w-full max-w-xs"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            aria-required="true"
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="lastName" className="sr-only">
                            Last Name
                        </label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            placeholder="Last name"
                            className="input input-bordered my-2 w-full max-w-xs"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            aria-required="true"
                        />
                    </div>
                </div>
                <div className="form-control">
                    <label htmlFor="email" className="sr-only">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        className="input input-bordered my-2 w-full max-w-xs"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        aria-required="true"
                    />
                    <label htmlFor="password" className="sr-only">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password"
                        className="input input-bordered my-2 w-full max-w-xs"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        aria-required="true"
                    />
                    {formData.password && (
                        <div id="password-checks" className="mt-2 text-xs">
                            <ul>
                                {Object.entries(passwordChecks).map(([key, isValid]) => (
                                    <li key={key} className={isValid ? "text-green-500" : "text-red-500"}>
                                        {isValid ? "✓" : "✗"}{" "}
                                        {key === "minLength"
                                            ? "At least 8 characters"
                                            : key === "maxLength"
                                              ? "At most 16 characters"
                                              : key === "upperCase"
                                                ? "Contains uppercase letter"
                                                : key === "number"
                                                  ? "Contains number"
                                                  : "Contains special character (!@#$%^&*)"}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <label htmlFor="confirmPassword" className="sr-only">
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        className="input input-bordered my-2 w-full max-w-xs"
                        value={confirmPassword}
                        onChange={handleInputChange}
                        required
                        aria-required="true"
                    />
                    {!passwordMatch && confirmPassword && (
                        <div id="password-match" className="mt-2 text-xs text-red-500">
                            ✗ Passwords do not match
                        </div>
                    )}
                </div>
                {errorMessage && (
                    <div id="error-message" className="mt-2 text-sm text-error" role="alert">
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div id="success-message" className="mt-2 text-sm text-success" role="alert">
                        <p>Verification link sent to your email. Please check your spam folder if not found.</p>
                        <p>Redirecting to login page in {countdown} seconds.</p>
                        <p>
                            If not redirected, please click{" "}
                            <a href="/login" className="text-blue-500 hover:text-blue-600 hover:underline">
                                here
                            </a>
                            .
                        </p>
                    </div>
                )}
                <div className="mt-4">
                    <button type="submit" className="btn btn-accent w-full" disabled={isLoading || !isFormValid} aria-busy={isLoading}>
                        {isLoading ? "Signing up..." : "Sign Up"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SignupForm;
