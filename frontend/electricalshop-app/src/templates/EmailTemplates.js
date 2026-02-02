// Email template components for server-side rendering

export const EmailHeader = () => `
  <div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
    <img src="${process.env.REACT_APP_BASE_URL || 'http://localhost:3000'}/elogo.png" 
         alt="Electronics Shop Logo" 
         style="width: 128px; height: 128px; border-radius: 50%; margin-bottom: 10px;" />
    <h1 style="color: #16a34a; margin: 0; font-size: 24px;">Electronics Shop</h1>
  </div>
`;

export const OrderConfirmationEmail = (orderData) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
    ${EmailHeader()}
    <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2>Order Confirmation</h2>
      <p>Thank you for your order! Your order #${orderData.orderNumber} has been confirmed.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
        <p><strong>Total:</strong> KSh ${orderData.total}</p>
      </div>
    </div>
  </body>
  </html>
`;

export const WelcomeEmail = (userData) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Welcome to Electronics Shop</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
    ${EmailHeader()}
    <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Electronics Shop!</h2>
      <p>Hi ${userData.name},</p>
      <p>Welcome to Kenya's premier electrical marketplace. We're excited to have you on board!</p>
    </div>
  </body>
  </html>
`;

export const PasswordResetEmail = (resetData) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Password Reset</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
    ${EmailHeader()}
    <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetData.resetLink}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
    </div>
  </body>
  </html>
`;