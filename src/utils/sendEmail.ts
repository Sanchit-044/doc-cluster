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

const sendEmail = (
  email: string,
  subject: string,
  body: string,
  data: string
) => {
  transporter.sendMail({
    from: `"Chrona" <no-reply@chrona.com>`,
    to: email,
    subject,
    html: `
    <div style="
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f9fafb;
      padding: 40px 20px;
      color: #333;
    ">
      <div style="
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        border-radius: 10px;
        padding: 30px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      ">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="
            color: #4f46e5;
            font-size: 28px;
            margin-bottom: 5px;
          ">Chrona</h1>
          <p style="
            font-size: 14px;
            color: #6b7280;
          ">Your time management companion</p>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

        <div style="font-size: 16px; line-height: 1.6;">
          <p style="margin-bottom: 10px;">${body}</p>
          <div style="
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
            color: #1f2937;
            margin-top: 10px;
            font-size: 18px;
          ">
            ${data}
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

        <div style="text-align: center; font-size: 13px; color: #9ca3af;">
          <p>© ${new Date().getFullYear()} Chrona. All rights reserved.</p>
        </div>
      </div>
    </div>
    `,
  });
};

export { sendEmail };
