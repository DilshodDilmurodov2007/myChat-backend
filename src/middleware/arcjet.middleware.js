import { isSpoofedBot } from "@arcjet/inspect";
import aj from "../lib/arcjet.js";

export const arcjetProtection = async(req,res, next) => {
    try {
        const decision = await aj.protect(req)
        if(decision.isDenied()) {
           if(decision.reason.isRateLimit()) return res.status(429).json({message:"Rate Limit Exceeded. Try again later."})
           else if (decision.reason.isBot()) return res.status(403).json({message:"Bot access denied."})
           else return res.status(403).json({message:"Access denied by security policy."})
        }
        // check for spoofed bots
        if(decision.results.some(isSpoofedBot)) return res.status(403).json({
            message: "Malicious bot activity detected.",
            error: "Spoofed Bot detected"
        })
        next()
    } catch (error) {
        console.error(error)
        next()
    }
}