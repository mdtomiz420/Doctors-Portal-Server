require('dotenv').config()
const nodemailer = require("nodemailer");

function sendMailFormContact(app , collection) {
    app.post('/send-contact-message', (req, res) => {
        const senderData = req.body;
        async function main() {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'mdtomiz.official@gmail.com',
                    pass: process.env.NODEMAILER_PASS,
                },
            });
            // send mail with defined transport object
            const info = await transporter.sendMail({
                from: 'mdtomiz.official@gmail.com',
                to: 'mdtomiz.official@gmail.com',
                subject: senderData.subject,
                text: "Doctors Portal ✔",
                html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                  <h4 style="color: rgb(0, 1, 65);">You Reciced a message From ${senderData.fromEmail}</h4>
                  <h4>${senderData.message}</h4>
                  <a href='https://doctors-portal-4.netlify.app/' style="padding: 5px 10px;">Browse Our Website</a>
                </div>
                `,
            });
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            if(info.messageId){
                const result = await collection.insertOne(senderData)
            }
            res.send(info)
        }

        main().catch(console.error);

    })
}

module.exports = sendMailFormContact