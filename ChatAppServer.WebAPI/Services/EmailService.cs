using System.Net;
using System.Net.Mail;

public interface IEmailService
{
    Task SendWelcomeEmail(string email, string username);
    Task SendResetEmail(string email, string token);
    Task SendPasswordChangeEmail(string email, string username);
    Task SendResetSuccessEmail(string email, string username);
    Task SendEmailConfirmationAsync(string email, string firstName, string lastName);
    Task SendEmailConfirmationTokenAsync(Guid guid, string email, string firstName, string lastName, string token);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendWelcomeEmail(string email, string username)
    {
        var welcomeMessage = GenerateWelcomeMessage(username);
        await SendEmailAsync(email, "Welcome", welcomeMessage);
    }

    public async Task SendResetEmail(string email, string token)
    {
        var resetLink = $"{_configuration["AppSettings:ClientURL"]}/reset-password?token={token}";
        var resetMessage = GenerateResetMessage(resetLink);
        await SendEmailAsync(email, "Password Reset", resetMessage);
    }

    public async Task SendPasswordChangeEmail(string email, string username)
    {
        var changePasswordMessage = GenerateChangePasswordMessage(username);
        await SendEmailAsync(email, "Password Changed", changePasswordMessage);
    }

    public async Task SendResetSuccessEmail(string email, string username)
    {
        var resetSuccessMessage = GenerateResetSuccessMessage(username);
        await SendEmailAsync(email, "Password Reset Successfully", resetSuccessMessage);
    }

    public async Task SendEmailConfirmationAsync(string email, string firstName, string lastName)
    {
        var confirmationMessage = GenerateEmailConfirmationMessage(firstName, lastName);
        await SendEmailAsync(email, "Email Confirmation", confirmationMessage);
    }

    public async Task SendEmailConfirmationTokenAsync(Guid userId, string email, string firstName, string lastName, string token)
    {
        var confirmationLink = $"{_configuration["AppSettings:ClientURL"]}/api/Auth/confirm-email?userId={userId}&token={token}";
        var confirmationMessage = GenerateEmailConfirmationTokenMessage(firstName, lastName, confirmationLink);
        await SendEmailAsync(email, "Email Confirmation", confirmationMessage);
    }

    private async Task SendEmailAsync(string email, string subject, string body)
    {
        var mailMessage = new MailMessage
        {
            From = new MailAddress("no-reply@yourapp.com"),
            Subject = subject,
            Body = body,
            IsBodyHtml = true,
        };
        mailMessage.To.Add(email);

        using var smtpClient = new SmtpClient(_configuration["Smtp:Host"], int.Parse(_configuration["Smtp:Port"]))
        {
            Credentials = new NetworkCredential(_configuration["Smtp:Username"], _configuration["Smtp:Password"]),
            EnableSsl = true
        };

        await smtpClient.SendMailAsync(mailMessage);
    }

    private string GenerateWelcomeMessage(string username)
    {
        return $@"
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ width: 100%; padding: 20px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); border-radius: 10px; max-width: 600px; margin: 20px auto; }}
                .header {{ background-color: #4CAF50; color: white; padding: 10px 0; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; }}
                .content h2 {{ color: #333333; }}
                .content p {{ line-height: 1.6; color: #666666; }}
                .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #999999; }}
                .footer a {{ color: #4CAF50; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Welcome to Harmony Chat</h1>
                </div>
                <div class='content'>
                    <h2>Hello {username},</h2>
                    <p>Thank you for registering at our site! We're excited to have you on board.</p>
                    <p>If you have any questions, feel free to <a href='mailto:harmonyteam104@gmail.com'>contact us</a>.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The Harmony Team</p>
                </div>
                <div class='footer'>
                    <p>&copy; {DateTime.Now.Year} Harmony. All rights reserved.</p>
                    <p><a href='https://yourapp.com/privacy'>Privacy Policy</a> | <a href='https://yourapp.com/terms'>Terms of Service</a></p>
                </div>
            </div>
        </body>
        </html>";
    }

    private string GenerateResetMessage(string resetLink)
    {
        return $@"
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ width: 100%; padding: 20px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); border-radius: 10px; max-width: 600px; margin: 20px auto; }}
                .header {{ background-color: #4CAF50; color: white; padding: 10px 0; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; }}
                .content h2 {{ color: #333333; }}
                .content p {{ line-height: 1.6; color: #666666; }}
                .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #999999; }}
                .footer a {{ color: #4CAF50; text-decoration: none; }}
                .button {{ display: inline-block; padding: 10px 20px; margin: 20px 0; font-size: 16px; color: #ffffff; background-color: #4CAF50; border-radius: 5px; text-decoration: none; color: white; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Password Reset Request</h1>
                </div>
                <div class='content'>
                    <h2>Hello,</h2>
                    <p>We received a request to reset your password. Click the button below to reset your password.</p>
                    <p><a href='{resetLink}' class='button' style='color: white;'>Reset Password</a></p>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The Harmony Team</p>
                </div>
                <div class='footer'>
                    <p>&copy; {DateTime.Now.Year} Harmony. All rights reserved.</p>
                    <p><a href='https://yourapp.com/privacy'>Privacy Policy</a> | <a href='https://yourapp.com/terms'>Terms of Service</a></p>
                </div>
            </div>
        </body>
        </html>";
    }

    private string GenerateChangePasswordMessage(string username)
    {
        return $@"
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ width: 100%; padding: 20px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); border-radius: 10px; max-width: 600px; margin: 20px auto; }}
                .header {{ background-color: #4CAF50; color: white; padding: 10px 0; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; }}
                .content h2 {{ color: #333333; }}
                .content p {{ line-height: 1.6; color: #666666; }}
                .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #999999; }}
                .footer a {{ color: #4CAF50; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Password Changed</h1>
                </div>
                <div class='content'>
                    <h2>Hello {username},</h2>
                    <p>Your password has been changed successfully. If you did not make this change, please contact our support team immediately.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The Harmony Team</p>
                </div>
                <div class='footer'>
                    <p>&copy; {DateTime.Now.Year} Harmony. All rights reserved.</p>
                    <p><a href='https://yourapp.com/privacy'>Privacy Policy</a> | <a href='https://yourapp.com/terms'>Terms of Service</a></p>
                </div>
            </div>
        </body>
        </html>";
    }

    private string GenerateResetSuccessMessage(string username)
    {
        return $@"
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ width: 100%; padding: 20px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); border-radius: 10px; max-width: 600px; margin: 20px auto; }}
                .header {{ background-color: #4CAF50; color: white; padding: 10px 0; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; }}
                .content h2 {{ color: #333333; }}
                .content p {{ line-height: 1.6; color: #666666; }}
                .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #999999; }}
                .footer a {{ color: #4CAF50; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Password Reset Successfully</h1>
                </div>
                <div class='content'>
                    <h2>Hello {username},</h2>
                    <p>Your password has been reset successfully. If you did not request this change, please contact our support team immediately.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The Harmony Team</p>
                </div>
                <div class='footer'>
                    <p>&copy; {DateTime.Now.Year} Harmony. All rights reserved.</p>
                    <p><a href='https://yourapp.com/privacy'>Privacy Policy</a> | <a href='https://yourapp.com/terms'>Terms of Service</a></p>
                </div>
            </div>
        </body>
        </html>";
    }

    private string GenerateEmailConfirmationMessage(string firstName, string lastName)
    {
        return $@"
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ width: 100%; padding: 20px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); border-radius: 10px; max-width: 600px; margin: 20px auto; }}
                .header {{ background-color: #4CAF50; color: white; padding: 10px 0; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; }}
                .content h2 {{ color: #333333; }}
                .content p {{ line-height: 1.6; color: #666666; }}
                .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #999999; }}
                .footer a {{ color: #4CAF50; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Email Confirmation</h1>
                </div>
                <div class='content'>
                    <h2>Hello {firstName} {lastName},</h2>
                    <p>Your email has been changed successfully. If you did not make this change, please contact our support team immediately.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The Harmony Team</p>
                </div>
                <div class='footer'>
                    <p>&copy; {DateTime.Now.Year} Harmony. All rights reserved.</p>
                    <p><a href='https://yourapp.com/privacy'>Privacy Policy</a> | <a href='https://yourapp.com/terms'>Terms of Service</a></p>
                </div>
            </div>
        </body>
        </html>";
    }

    private string GenerateEmailConfirmationTokenMessage(string firstName, string lastName, string confirmationLink)
    {
        return $@"
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ width: 100%; padding: 20px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); border-radius: 10px; max-width: 600px; margin: 20px auto; }}
            .header {{ background-color: #4CAF50; color: white; padding: 10px 0; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ padding: 20px; }}
            .content h2 {{ color: #333333; }}
            .content p {{ line-height: 1.6; color: #666666; }}
            .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #999999; }}
            .footer a {{ color: #4CAF50; text-decoration: none; }}
            .button {{ display: inline-block; padding: 10px 20px; margin: 20px 0; font-size: 16px; color: #ffffff; background-color: #4CAF50; border-radius: 5px; text-decoration: none; color: white; }}
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Email Confirmation</h1>
            </div>
            <div class='content'>
                <h2>Hello {firstName} {lastName},</h2>
                <p>Thank you for registering. Please click the button below to confirm your email address.</p>
                <p><a href='{confirmationLink}' class='button' style='color: white;'>Confirm Email</a></p>
                <br>
                <p>Best regards,</p>
                <p>The Harmony Team</p>
            </div>
            <div class='footer'>
                <p>&copy; {DateTime.Now.Year} Harmony. All rights reserved.</p>
                <p><a href='https://yourapp.com/privacy'>Privacy Policy</a> | <a href='https://yourapp.com/terms'>Terms of Service</a></p>
            </div>
        </div>
    </body>
    </html>";
    }
}
