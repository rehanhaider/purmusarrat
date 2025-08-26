import { PUBLIC_RECAPTCHA_CLIENT_KEY } from "astro:env/client";

const loadRecaptcha = () => {
    // Load the reCAPTCHA script
    if (PUBLIC_RECAPTCHA_CLIENT_KEY) {
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${PUBLIC_RECAPTCHA_CLIENT_KEY}`;
        script.async = true;
        document.body.appendChild(script);
    }
};

const getRecaptchaToken = async () => {
    if (PUBLIC_RECAPTCHA_CLIENT_KEY) {
        const token = await (window as any).grecaptcha.execute(PUBLIC_RECAPTCHA_CLIENT_KEY, { action: "signup" });
        return token;
    }
    return null;
};

export { loadRecaptcha, getRecaptchaToken };
