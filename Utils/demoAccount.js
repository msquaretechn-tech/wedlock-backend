// Review/demo accounts (e.g. for Apple App Review) that cannot receive real SMS or email codes.
// Only emails listed in DEMO_ACCOUNT_EMAILS (comma separated) get the fixed codes; the password
// is still checked as usual. Leave DEMO_ACCOUNT_EMAILS empty to switch this off completely.
//
//   DEMO_ACCOUNT_EMAILS=rssdemo@gmail.com
//   DEMO_OTP=123456          (login OTP; the 4-digit email activation code uses its first 4 digits)

const demoEmails = () =>
    (process.env.DEMO_ACCOUNT_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

export const isDemoAccount = (email) => !!email && demoEmails().includes(String(email).trim().toLowerCase());

export const demoLoginOtp = () => process.env.DEMO_OTP || "123456";

export const demoActivationCode = () => demoLoginOtp().slice(0, 4);
