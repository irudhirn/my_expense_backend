import nodemailer from "nodemailer";

const sendMail = async (options) => {
    const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    // Activate in gmail "less secure app" option
  });
  // In configuration object we specify service, and there are several well known services that nodemail knows how to deal with that's why  we don't have to deal with it manually. Services are like 'Gmail', 'Yahoo', 'Hotmail'. Then we need to specify auth property for authentication, we put email and password in config.env file.
  // In gmail account we actually have to activate something called "less secure app" option. And the reason why we're not using 'Gmail' in this application is because 'Gmail' is not at all a good idea for a production app. So using 'Gmail' for this kind of stuff, we can only send 500 emails per day, and also, we'll probably very quickly be marked as a spammer, and from there, things will only get worse. So, unless it's like a private app, and we just send emails to ourself, or like 10 friends, then we should use another service. And some well-known services are SendGrid and Mailgun.
  // Now, what we should do right now is to use a special development service, which basically fakes to send emails to real addresses. But, in reality, these emails end trapped in a development inbox, so that we can then take a look at how they will look later in production. So that service is called 'Mailtrap', and so we now need to sign up on that. Then we create new inbox with name 'natours', we open it to see its credentials like 'host', 'port' 'username', 'password', etc. which we save in our config.env and add that in configuration object of createTransport() method. Then we move onto step-2 below.

  // 2) Define the email options
  // Here we write email options, which includes where the email is coming from, recipient's address, subject and text. We can also secify html property
  const mailOptions = {
    from: 'Expense Tracker Team <hello@rudh.io>',
    to: options.email, // options is the object we are getting in argument
    subject: options.subject,
    text: options.message, // this is text version of email
    // html:  // we can convert message to html
  }

  // 3) Actually send the email
  // Finally we can call .sendMail() method on 'transporter' we created above in we need to pass 'mailOptions'
  await transporter.sendMail(mailOptions);
}

export default sendMail;