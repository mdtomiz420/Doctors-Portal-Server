
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const getService = require('./Routes/service');

const jwt = require('jsonwebtoken')
require('dotenv').config()

var token = jwt.sign({ foo: 'bar' }, 'shhhhh');

const app = express()
app.use(cors())
app.use(bodyParser.json())

const PORT = process.env.PORT || 5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y7jek.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const serviceCollection = client.db("doctors_portal").collection("services")
const appointmentCollection = client.db("doctors_portal").collection("appointment")
const userCollection = client.db("doctors_portal").collection("user")

const VerifyJwt = (req, res, next) => {
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
async function run() {
  await client.connect()
  console.log('Database Connected')

  getService(serviceCollection, app) //get User Route

  // put user Route 


  app.get('/available', async (req, res) => {
    const date = req.query.date
    // Get All data From Service collection

    const services = await serviceCollection.find().toArray()

    // Get appointments of That Day

    const query = { date: date }

    const appointments = await appointmentCollection.find(query).toArray()

    // For Each Service
    services.forEach((service) => {
      const serviceAppointment = appointments.filter(appoint => appoint.treatment === service.name)

      const appointedSlots = serviceAppointment.map(app => app.slot)

      const available = service.slot.filter(slot1 => !appointedSlots.includes(slot1))

      service.slot = available
    });

    res.send(services)

  })

  app.post('/appointment', async (req, res) => {
    const ApData = req.body
    const query = { date: ApData.date, slot: ApData.slot, email: ApData.email }
    const exists = await appointmentCollection.findOne(query)
    if (exists) {
      return res.send({ success: false, appointment: exists })
    }
    const result = await appointmentCollection.insertOne(ApData)

    res.send({ success: true, result })
  })


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


  app.get('/appointment', VerifyJwt, async (req, res) => {
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
  app.delete('/appointment/:id', async (req, res) => {
    const id = req.params.id
    const result = await appointmentCollection.deleteOne({ "_id": ObjectId(id) });

    res.send({ deleted: true })
  })

}
run().catch(console.dir)



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
