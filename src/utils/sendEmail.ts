import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  auth: {
    user: process.env.COMP_EMAIL,
    pass: process.env.COMP_PASS,
  },
});

type SendEmailParams = {
  email: string;
  subject: string;
  username: string;
  otp: string;
  subjectText: string;
  closingText: string;
};

const sendEmail = async ({
  email,
  subject,
  username,
  otp,
  subjectText,
  closingText,
}: SendEmailParams) => {
  await transporter.sendMail({
    from: `"Doc-Cluster" <${process.env.COMP_EMAIL}>`,
    to: email,
    subject,
    html: `
      <body style="margin: 0; padding: 0; width: 100%; font-family: Arial, sans-serif; background-color: #ffffff;">
        <div style="max-width: 600px; width: 100%; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #EFF6FF; box-sizing: border-box;">

          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 20px;">
            <img 
              src="https://i.ibb.co/T1BNfgR/Untitled.jpg" 
              alt="Doc-Cluster" 
              style="width: 140px; margin: 0 auto;"
            />
          </div>

          <!-- Greeting -->
          <p style="color: #1E3A8A; font-size: 20px; line-height: 1.5; text-align: center;">
            Hello <strong>${username}</strong>,
          </p>

          <!-- Subject -->
          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
            ${subjectText}
          </p>

          <!-- OTP Box -->
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 30px; font-weight: bold; color: #2563EB;">
              ${otp}
            </span>
          </div>

          <!-- Info Text -->
          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
            This OTP is valid for the next <strong>10 minutes</strong>. 
            Please keep it secure and do not share it with anyone.
          </p>

          <!-- Closing -->
          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; text-align: center;">
            ${closingText}
          </p>

          <!-- Signature -->
          <p style="color: #1E3A8A; font-size: 16px; line-height: 1.6; text-align: center; margin-top: 20px;">
            Best regards,<br />
            <strong>Doc-Cluster Team</strong>
          </p>

          <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 30px 0;" />

          <!-- Footer -->
          <p style="font-size: 13px; color: #6B7280; text-align: center; line-height: 1.5;">
            Need help? Contact our support team at 
            <a 
              href="mailto:doccluster4u@gmail.com" 
              style="color: #2563EB; text-decoration: none;"
            >
              doccluster4u@gmail.com
            </a>.
          </p>

        </div>
      </body>
    `,
  });
};

export { sendEmail };
