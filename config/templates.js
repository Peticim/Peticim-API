export const getVerificationEmailTemplate = (emailVerificationLink) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #662c91; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Hesabınızı Doğrulayın</h1>
        </div>
        <div style="padding: 20px; text-align: center;">
            <img src="https://peticimapp.com/logo.png" alt="Peticim Logo" style="max-width: 100px; margin: 0 auto 20px; display: block;">
            <p style="font-size: 16px; color: #555;">Merhaba!</p>
            <p style="font-size: 16px; color: #555; line-height: 1.5;">Hesabınızı başarıyla oluşturduğunuz için teşekkür ederiz. Aşağıdaki butona tıklayarak hesabınızı aktif hale getirebilirsiniz.</p>
            <a href="${emailVerificationLink}" style="background-color: #662c91; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block; margin: 20px 0;">Hesabımı Doğrula</a>
            <p style="font-size: 14px; color: #888; margin-top: 30px;">Buton çalışmıyorsa, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:</p>
            <p style="font-size: 14px; color: #662c91; word-break: break-all;"><a href="${emailVerificationLink}" style="color: #662c91;">${emailVerificationLink}</a></p>
        </div>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            <p>&copy; 2025 Peticim. Tüm hakları saklıdır.</p>
        </div>
    </div>
  `;
};

export const getPasswordResetEmailTemplate = (passwordResetLink) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #662c91; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Şifre Sıfırlama</h1>
        </div>
        <div style="padding: 20px; text-align: center;">
            <img src="https://peticimapp.com/logo.png" alt="Peticim Logo" style="max-width: 100px; margin: 0 auto 20px; display: block;">
            <p style="font-size: 16px; color: #555;">Merhaba!</p>
            <p style="font-size: 16px; color: #555; line-height: 1.5;">Şifrenizi sıfırlama isteği aldık. Aşağıdaki butona tıklayarak yeni bir şifre belirleyebilirsiniz. Bu isteği siz yapmadıysanız, bu e-postayı dikkate almayın.</p>
            <a href="${passwordResetLink}" style="background-color: #662c91; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block; margin: 20px 0;">Şifremi Sıfırla</a>
            <p style="font-size: 14px; color: #888; margin-top: 30px;">Buton çalışmıyorsa, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:</p>
            <p style="font-size: 14px; color: #662c91; word-break: break-all;"><a href="${passwordResetLink}" style="color: #662c91;">${passwordResetLink}</a></p>
        </div>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            <p>&copy; 2025 Peticim. Tüm hakları saklıdır.</p>
        </div>
    </div>
  `;
};
