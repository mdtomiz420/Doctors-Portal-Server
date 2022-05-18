const nodemailer = require("nodemailer");
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const getService = require('./Routes/service');
const createUser = require('./Routes/createUser');
const jwt = require('jsonwebtoken');
const createAdmin = require('./Routes/admin');
const sendMailFormContact = require("./Routes/contactMail");

require('dotenv').config()


const app = express()
app.use(cors())
app.use(bodyParser.json())

const PORT = process.env.PORT || 5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y7jek.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// All Collections 
const serviceCollection = client.db("doctors_portal").collection("services")
const appointmentCollection = client.db("doctors_portal").collection("appointment")
const userCollection = client.db("doctors_portal").collection("user")
const doctorsCollection = client.db("doctors_portal").collection("doctor")
const messageCollection = client.db("doctors_portal").collection("message")

const verifyJWT = (req, res, next) => {
  const accessToken = req.headers.auth
  if (!accessToken) {
    return res.status(401).send({ message: 'UnAuthoraized' })
  }
  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" })
    }
    req.decoded = decoded
    next()
  });
}
// function for send mail with nodemailer 
// function for send mail with nodemailer 

const sendEmail = (senderData) => {
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
      to: senderData.email,
      subject: "Doctors Portal ✔",
      text: "Doctors Portal ✔",
      html: `
          </div>
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <h4 style="color: rgb(0, 1, 65);">Hello ${senderData.email}</h4>
            <p>Thank you for requesting an appointment !!</p>
            <h4 style="color: green;">You Appointment Recived Successfully</h4>
            <h4>Treatment Name : ${senderData.treatment}</h4>
            <h4>Date : ${senderData.date}</h4>
            <h4>Time : ${senderData.slot}</h4>
            <p>Please Pay For Confirm Your Appointment.</p>
            <a href='https://doctors-portal-4.netlify.app/dashboard' style="padding: 5px 10px;">Pay</a>
          </div>
          `,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }

  main().catch(console.error);
}
// End Nodemailer 
// End Nodemailer 
async function run() {
  await client.connect()
  console.log('Database Connected')
  getService(serviceCollection, app) //get User Route


  // Api for get availavle services 
  // Api for get availavle services 
  app.get('/available', async (req, res) => {
    const date = req.query.date
    const services = await serviceCollection.find().toArray()
    const query = { date: date }
    const appointments = await appointmentCollection.find(query).toArray()
    services.forEach((service) => {
      const serviceAppointment = appointments.filter(appoint => appoint.treatment === service.name)
      const appointedSlots = serviceAppointment.map(app => app.slot)
      const available = service.slot.filter(slot1 => !appointedSlots.includes(slot1))
      service.slot = available
    });
    res.send(services)
  })
  // Api for post doctors 
  // Api for post doctors 
  app.post('/doctor', async (req, res) => {
    const data = req.body
    const result = await doctorsCollection.insertOne(data)
    res.send(result)
  })
  // API For get all doctor 
  // API For get all doctor 
  app.get('/doctors', async (req, res) => {
    const cursor = doctorsCollection.find()
    const result = await cursor.toArray()
    res.send(result)
  })
  app.delete('/doctor/:id' ,async (req , res) => {
    const id = req.params.id
    const result = await doctorsCollection.deleteOne({ "_id": ObjectId(id) });
    res.send(result)
  })
  app.post('/apointment', async (req, res) => {
    const ApData = req.body
    const query = { date: ApData.date, slot: ApData.slot, email: ApData.email }
    const exists = await appointmentCollection.findOne(query)
    if (exists) {
      return res.send({ success: false, appointment: exists })
    }
    const result = await appointmentCollection.insertOne(ApData)
    sendEmail(ApData)
    res.send({ success: true, result })
  })

  app.get('/appointment', verifyJWT, async (req, res) => {
    const email = req.query.email
    const decodedEmail = req.decoded.email
    const query = { email: email };
    if (decodedEmail === email) {
      const cursor = appointmentCollection.find(query)
      const result = await cursor.toArray();
      return res.send(result)
    }
    else {
      return res.status(403).send({ message: 'Forbidden Access' })
    }
  })
  // Get All Apointment 
  // Get All Apointment 
  app.get('/all-appointment', verifyJWT, async (req, res) => {
    const email = req.query.email
    const decodedEmail = req.decoded.email
    if (decodedEmail === email) {
      const cursor = appointmentCollection.find({})
      const result = await cursor.toArray();
      return res.send(result)
    }
    else {
      return res.status(403).send({ message: 'Forbidden Access' })
    }
  })
  app.get('/appointment-one', verifyJWT, async (req, res) => {
    const email = req.query.email
    const query = { email: email }
    const cursor = appointmentCollection.find(query)
    const result = await cursor.toArray()
    res.send(result)
  })

  app.delete('/appointment/:id', async (req, res) => {
    const id = req.params.id
    const result = await appointmentCollection.deleteOne({ "_id": ObjectId(id) });

    res.send(result)
  })
  // API for create users 
  // API for create users 
  app.put('/user/:email', async (req, res) => {
    const email = req.params.email;
    const user = req.body;
    const filter = { email: email };
    const options = { upsert: true };
    const updateDoc = {
      $set: user
    };
    const result = await userCollection.updateOne(filter, updateDoc, options);
    const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN)

    res.send({ accessToken: token, result });
  })

  app.get('/user', verifyJWT, async (req, res) => {
    const user = await userCollection.find().toArray()
    res.send(user)
  })

  app.put('/user/admin/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;
    const requester = req.decoded.email;
    const requesterAccount = await userCollection.findOne({ email: requester });
    const arg = req.body

    if (requesterAccount.role === 'admin') {
      const filter = { email: email };
      const updateDoc = {
        $set: arg
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    }
    else {
      res.status(403).send({ message: 'forbidden' });
    }

  })
  // getCurrentuser 

  app.get('/currentuser', verifyJWT, async (req, res) => {
    const email = req.query.email
    const query = { email: email };
    const cursor = userCollection.find(query)
    const result = await cursor.toArray()
    res.send(result)
  })

  // get Message For current user 
  app.get('/messages', verifyJWT, async (req, res) => {
    const email = req.query.email
    const query = { email: email };
    const cursor = messageCollection.find(query)
    const result = await cursor.toArray()
    res.send(result)
  })
  // get Message For Admin
  app.get('/messages-all', verifyJWT, async (req, res) => {
    const cursor = messageCollection.find()
    const result = await cursor.toArray()
    res.send(result)
  })
  app.delete('/messages/:id', verifyJWT, async (req, res) => {
    const id = req.params.id
    const query = { "_id": ObjectId(id) }
    const result = await messageCollection.deleteOne(query);
    res.send(result)
  })

}
run().catch(console.dir)

sendMailFormContact(app, messageCollection)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
