import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { loadEnv } from "vite";
import { Resend } from "resend";
import { admin } from "better-auth/plugins";
import { APP_CONFIG, EMAIL_TEMPLATES } from "./config";

// Load environment variables manually
const env = loadEnv("", process.cwd(), "");
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;
const RESEND_API_KEY = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

// Verify DATABASE_URL is available
if (!DATABASE_URL) {
    console.error("Available env keys:", Object.keys(env).filter(k => k.includes("DATA")));
    throw new Error("DATABASE_URL is not defined in environment variables");
}

console.log("DATABASE_URL configured:", DATABASE_URL.substring(0, 30) + "...");

// Initialize Resend
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

if (!RESEND_API_KEY) {
    console.warn("⚠️  RESEND_API_KEY not found. Emails will be logged to console instead of being sent.");
}

// Verify Google OAuth credentials
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    console.log("✅ Google OAuth configured");
} else {
    console.warn("⚠️  Google OAuth credentials not found. Social sign-in will not be available.");
}

export const auth = betterAuth({
    database: new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Neon requires SSL
    }),
    baseURL: "http://localhost:4321",
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    },
    advanced: {
        cookiePrefix: "larico",
        useSecureCookies: false, // Must be false for http://localhost
        crossSubDomainCookies: {
            enabled: false,
        },
    },
    plugins: [
        admin({
            adminRoles: ["admin"],
        })
    ],
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user"
            },
            banned: {
                type: "boolean",
                defaultValue: false
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        // Password reset configuration
        sendResetPassword: async ({ user, url, token }, request) => {
            if (resend) {
                try {
                    await resend.emails.send({
                        from: APP_CONFIG.email.from,
                        to: user.email,
                        subject: EMAIL_TEMPLATES.passwordReset.subject,
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="utf-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            </head>
                            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                                    <h1 style="color: white; margin: 0; font-size: 28px;">🔐 ${APP_CONFIG.name}</h1>
                                </div>
                                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                                    <h2 style="color: #1f2937; margin-top: 0;">Restablecer Contraseña</h2>
                                    <p style="color: #4b5563; font-size: 16px;">Hola,</p>
                                    <p style="color: #4b5563; font-size: 16px;">Recibimos una solicitud para restablecer tu contraseña en ${APP_CONFIG.name}.</p>
                                    <p style="color: #4b5563; font-size: 16px;">Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${url}" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                                            Restablecer Contraseña
                                        </a>
                                    </div>
                                    <p style="color: #6b7280; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
                                    <p style="color: #6366f1; font-size: 14px; word-break: break-all;">${url}</p>
                                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">⏰ Este enlace expirará en 1 hora.</p>
                                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">🔒 Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
                                    </div>
                                    <p style="color: #4b5563; font-size: 16px; margin-top: 30px;">Saludos,<br><strong>El equipo de ${APP_CONFIG.name}</strong></p>
                                </div>
                                <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                                    <p>${APP_CONFIG.copyright}</p>
                                </div>
                            </body>
                            </html>
                        `,
                    });
                    console.log(`✅ Password reset email sent to: ${user.email}`);
                } catch (error) {
                    console.error('❌ Error sending password reset email:', error);
                    throw error;
                }
            } else {
                // Fallback to console logging if Resend is not configured
                console.log('=== PASSWORD RESET EMAIL ===');
                console.log('To:', user.email);
                console.log('Reset URL:', url);
                console.log('Token:', token);
                console.log('===========================');
            }
        },
        onPasswordReset: async ({ user }, request) => {
            console.log(`Password reset completed for user: ${user.email}`);
        },
        resetPasswordTokenExpiresIn: 3600, // 1 hour in seconds
    },
    // Email verification configuration
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => {
            if (resend) {
                try {
                    await resend.emails.send({
                        from: APP_CONFIG.email.from,
                        to: user.email,
                        subject: EMAIL_TEMPLATES.emailVerification.subject,
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="utf-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            </head>
                            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                                    <h1 style="color: white; margin: 0; font-size: 28px;">✉️ ${APP_CONFIG.name}</h1>
                                </div>
                                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                                    <h2 style="color: #1f2937; margin-top: 0;">Verifica tu Email</h2>
                                    <p style="color: #4b5563; font-size: 16px;">¡Hola!</p>
                                    <p style="color: #4b5563; font-size: 16px;">Gracias por registrarte en ${APP_CONFIG.name}. Estamos emocionados de tenerte con nosotros.</p>
                                    <p style="color: #4b5563; font-size: 16px;">Para completar tu registro, por favor verifica tu dirección de email haciendo clic en el siguiente botón:</p>
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${url}" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                                            Verificar Email
                                        </a>
                                    </div>
                                    <p style="color: #6b7280; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
                                    <p style="color: #6366f1; font-size: 14px; word-break: break-all;">${url}</p>
                                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">🔒 Si no creaste esta cuenta, puedes ignorar este email de forma segura.</p>
                                    </div>
                                    <p style="color: #4b5563; font-size: 16px; margin-top: 30px;">Saludos,<br><strong>El equipo de ${APP_CONFIG.name}</strong></p>
                                </div>
                                <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                                    <p>${APP_CONFIG.copyright}</p>
                                </div>
                            </body>
                            </html>
                        `,
                    });
                    console.log(`✅ Verification email sent to: ${user.email}`);
                } catch (error) {
                    console.error('❌ Error sending verification email:', error);
                    throw error;
                }
            } else {
                // Fallback to console logging if Resend is not configured
                console.log('=== EMAIL VERIFICATION ===');
                console.log('To:', user.email);
                console.log('Verification URL:', url);
                console.log('Token:', token);
                console.log('==========================');
            }
        },
        sendOnSignUp: true, // Automatically send verification email on signup
        autoSignInAfterVerification: true, // Auto sign in after verification
    },
    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID || "",
            clientSecret: GOOGLE_CLIENT_SECRET || "",
            enabled: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
        },
    }
});
