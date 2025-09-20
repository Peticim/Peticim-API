import admin from "../config/firebase.js";
import nodemailer from "nodemailer";
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
} from "../config/templates.js";
import { handleError } from "../utils/errorHandler.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL,
    pass: process.env.MAIL_PASS,
  },
});

export const sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const actionCodeSettings = {
      url: `https://peticimapp.com/`,
      handleCodeInApp: true,
    };
    const emailVerificationLink = await admin
      .auth()
      .generateEmailVerificationLink(email, actionCodeSettings);
    const mailOptions = {
      from: { name: "Peticim", address: "peticimapp@gmail.com" },
      to: email,
      subject: "Hesabınızı Doğrulayın",
      html: getVerificationEmailTemplate(emailVerificationLink),
    };
    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ success: true, message: "Confirmation e-mail sent!" });
  } catch (error) {
    console.log("SEND_VERIFICATION_EMAIL_ERROR", error);
    const { success, message, statusCode } = handleError(error);
    res.status(statusCode).json({
      success,
      message,
    });
  }
};

export const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const actionCodeSettings = {
      url: `https://peticimapp.com/`,
      handleCodeInApp: true,
    };
    const passwordResetLink = await admin
      .auth()
      .generatePasswordResetLink(email, actionCodeSettings);

    const mailOptions = {
      from: { name: "Peticim", address: "peticimapp@gmail.com" },
      to: email,
      subject: "Şifre Sıfırlama",
      html: getPasswordResetEmailTemplate(passwordResetLink),
    };
    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ success: true, message: "Password reset email sent!" });
  } catch (error) {
    console.log("SEND_PASSWORD_RESET_EMAIL_ERROR", error);
    const { success, message, statusCode } = handleError(error);
    res.status(statusCode).json({
      success,
      message,
    });
  }
};
