import React, { useState, useEffect } from "react";
import { UserService } from "@lib/auth/user";
import { AuthService } from "@lib/auth/auth";

export const SettingsForm = () => {
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordChecks, setPasswordChecks] = useState<Record<string, boolean>>({});
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const passwordRegex = {
        minLength: /.{8,}/,
        maxLength: /^.{0,16}$/,
        upperCase: /[A-Z]/,
        number: /[0-9]/,
        specialChar: /[!@#$%^&*]/,
    };

    useEffect(() => {
        const fetchEmail = async () => {
            const attributes = await UserService.getUserAttributes();
            setEmail(attributes.email || "");
        };

        fetchEmail();
    }, []);

    useEffect(() => {
        updatePasswordChecks();
    }, [newPassword]);

    useEffect(() => {
        checkPasswordMatch();
    }, [newPassword, confirmPassword]);

    const updatePasswordChecks = () => {
        const checks: Record<string, boolean> = {};
        Object.entries(passwordRegex).forEach(([key, regex]) => {
            checks[key] = regex.test(newPassword);
        });
        setPasswordChecks(checks);
    };

    const checkPasswordMatch = () => {
        setPasswordMatch(newPassword === confirmPassword);
    };

    const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage("");
        setChangePasswordSuccess(false);

        // Check if all password requirements are met
        const allPasswordChecksPassed = Object.values(passwordChecks).every((check) => check);

        if (!allPasswordChecksPassed) {
            setErrorMessage("New password does not meet all requirements");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        try {
            await AuthService.changePassword(currentPassword, newPassword);
            setChangePasswordSuccess(true);
            // Reset form fields
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Failed to change password:", error.message);
            setErrorMessage(error.message);
        }
    };

    return (
        <div className="card mx-4 w-full bg-base-200 p-4 shadow-lg">
            <div className="card-body">
                <h2 className="card-title">Change Password</h2>
                <div className="divider my-1"></div>
                <div className="h-full w-full">
                    <form id="changePassword" onSubmit={handleChangePassword} className="grid grid-cols-1 gap-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text text-base-content">Email</span>
                                </label>
                                <input
                                    title="Email"
                                    type="text"
                                    placeholder=""
                                    value={email}
                                    className="input input-bordered input-disabled w-full bg-neutral"
                                    readOnly={true}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text text-base-content">Enter Current Password</span>
                                </label>
                                <input
                                    title="Current Password"
                                    type="password"
                                    placeholder=""
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="input input-bordered w-full bg-neutral"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text text-base-content">Enter New Password</span>
                                </label>
                                <input
                                    title="New Password"
                                    type="password"
                                    placeholder=""
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input input-bordered w-full bg-neutral"
                                    required
                                />
                                {newPassword && (
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
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text text-base-content">Confirm New Password</span>
                                </label>
                                <input
                                    title="Confirm Password"
                                    type="password"
                                    placeholder=""
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input input-bordered w-full bg-neutral"
                                    required
                                />
                                {!passwordMatch && confirmPassword && (
                                    <div id="password-match" className="mt-2 text-xs text-red-500">
                                        ✗ Passwords do not match
                                    </div>
                                )}
                            </div>
                        </div>
                        {errorMessage && (
                            <div id="error-message" className="mt-2 text-sm text-error" role="alert">
                                {errorMessage}
                            </div>
                        )}
                        {changePasswordSuccess && (
                            <div id="success-message" className="mt-2 text-sm text-success" role="alert">
                                Password Changed Successfully
                            </div>
                        )}
                        <div className="mt-8 grid gap-6 md:grid-cols-2">
                            <button type="submit" className="btn btn-primary w-1/2">
                                Change Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsForm;
