import Nodemailer from "nodemailer";
import dotenv from 'dotenv';
import ejs from "ejs";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sendEmail = async ({ email, subject, template, data }) => {
    console.log("----- Sending Email Process Started -----");
    
    // Log environment details
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
    console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
    console.log(`SMTP_MAIL: ${process.env.SMTP_MAIL}`);
    console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD}`); // Masked password

    if (!template) {
        console.error("Error: Email template not defined");
        throw new Error("Template is not defined");
    }

    let transporter;
    try {
        transporter = Nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            }
        });

        console.log("SMTP transporter created successfully");

        // Verify SMTP connection
        await transporter.verify();
        console.log("SMTP connection verified");
    } catch (err) {
        console.error("Failed to create or verify transporter:", err.message);
        throw err;
    }

    try {
        const templatePath = path.join(__dirname, "../Mails", template);
        console.log(`Rendering email template from path: ${templatePath}`);

        const html = await ejs.renderFile(templatePath, data);
        console.log("Email template rendered successfully");

        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: subject,
            html
        };

        console.log(`Sending email to: ${email}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully: ${info.messageId}`);
    } catch (err) {
        console.error("Failed to render template or send email:", err.message);
        throw err;
    }

    console.log("----- Email Process Completed -----");
};

export default sendEmail;
