declare module 'nodemailer' {
  export type Transporter = {
    sendMail: (options: unknown) => Promise<{ messageId: string }>
  }

  const nodemailer: {
    createTransport: (options: unknown) => Transporter
  }

  export default nodemailer
}
