/**
 * Application Configuration
 * Centralized configuration for app name, branding, and metadata
 */

export const APP_CONFIG = {
    // Application Name
    name: "LaricoWallet",
    shortName: "LW",

    // Branding
    tagline: "Tu billetera financiera inteligente",
    description: "Gestiona gastos, deudas, ahorros y créditos en un solo lugar. Simple, claro y poderoso.",

    // Email Configuration
    email: {
        from: "LaricoWallet <noreply@wallet.larico.net>",
        supportEmail: "support@larico.net",
    },

    // URLs
    urls: {
        website: "https://larico.net",
        support: "https://larico.net/support",
        privacy: "https://larico.net/privacy",
        terms: "https://larico.net/terms",
    },

    // Copyright
    copyright: `© ${new Date().getFullYear()} LaricoWallet. Todos los derechos reservados.`,

    // Social Media (optional)
    social: {
        twitter: "@laricowallet",
        facebook: "laricowallet",
        instagram: "laricowallet",
    },
} as const;

// Email Templates Configuration
export const EMAIL_TEMPLATES = {
    passwordReset: {
        subject: `Restablecer tu contraseña - ${APP_CONFIG.name}`,
        preheader: "Recibimos una solicitud para restablecer tu contraseña",
    },
    emailVerification: {
        subject: `Verifica tu email - ${APP_CONFIG.name}`,
        preheader: "Gracias por registrarte, verifica tu email para continuar",
    },
} as const;
