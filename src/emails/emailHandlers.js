import { resendClient, sender } from "../lib/resend.js"
import { createWelcomeEmailTemplate } from "./emailTemplate.js"

 export const sendWelcomeEmail = async (email, name, clientURL) => {
    const {data, error} = await resendClient.emails.send({
        from: `${sender.name} <${sender.email}>`,
        to: email,
        subject: "Welcome to myChat!",
        html: createWelcomeEmailTemplate(name, clientURL)
    })
    if(error) {
        console.error(error)
        throw new Error("Failed Send Welcome Email")
    }
    console.log("Welcome Email Send Successfully", data);
 }
  