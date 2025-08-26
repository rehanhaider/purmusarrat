import React, { useEffect, useState } from "react";
import { UserService, AuthService } from "@lib/auth";
import { $user } from "@lib/stores/DefaultStore";

export const ProfileForm = () => {
    const [firstName, setFirstName] = useState($user.get().given_name);
    const [lastName, setLastName] = useState($user.get().family_name);
    const [email, setEmail] = useState($user.get().email);

    useEffect(() => {
        const fetchAttributes = async () => {
            console.log("Fetching attributes");
            const attributes = await UserService.getUserAttributes();
            console.log(attributes);
            setFirstName(attributes.given_name || "");
            setLastName(attributes.family_name || "");
            setEmail(attributes.email || "");
        };

        if (AuthService.isAuthenticated()) {
            fetchAttributes();
        }
    }, []);

    const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        UserService.updateUserAttributes({
            given_name: firstName,
            family_name: lastName,
        });
    };

    if (!AuthService.isAuthenticated()) {
        return <div>User is not authenticated. Redirecting to login...</div>;
    }

    return (
        <div className="card mx-4 w-full bg-base-200 p-4 shadow-lg">
            <div className="card-body">
                <h2 className="card-title">Profile Information</h2>
                <div className="divider my-1"></div>
                <div className="h-full w-full">
                    <form onSubmit={handleSave} className="grid grid-cols-1 gap-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text text-base-content">First Name</span>
                                </label>
                                <input
                                    title="First Name"
                                    type="text"
                                    placeholder=""
                                    value={firstName}
                                    onChange={(event) => setFirstName(event.target.value)}
                                    className="input input-bordered w-full bg-neutral"
                                    required
                                />
                            </div>
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text text-base-content">Last Name</span>
                                </label>
                                <input
                                    title="Last Name"
                                    type="text"
                                    placeholder=""
                                    value={lastName}
                                    onChange={(event) => setLastName(event.target.value)}
                                    className="input input-bordered w-full bg-neutral"
                                    required
                                />
                            </div>
                        </div>
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
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="input input-bordered input-disabled w-full bg-neutral"
                                    readOnly={true}
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-8 grid gap-6 md:grid-cols-2">
                            <button type="submit" className="btn btn-primary w-1/2">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileForm;
