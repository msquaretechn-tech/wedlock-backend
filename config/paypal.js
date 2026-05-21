import paypal from "@paypal/checkout-server-sdk";

function environment() {
    return process.env.PAYPAL_MODE === "live"
        ? new paypal.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
        )
        : new paypal.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
        );
}

const client = new paypal.core.PayPalHttpClient(environment());

export default client;