
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser')
const { MongoClient, ServerApiVersion , ObjectId } = require('mongodb');
require('dotenv').config()


const app = express()
app.use(cors())
app.use(bodyParser.json())

const PORT = process.env.PORT || 5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y7jek.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    await client.connect()
    console.log('Database Connected')
    const serviceCollection = client.db("doctors_portal").collection("services")
    const appointmentCollection = client.db("doctors_portal").collection("appointment")

    app.get('/services' , async (req , res)=>{
        const query = {};
        const cursor = serviceCollection.find(query)
        const services = await cursor.toArray();
        res.send(services)
    })

    app.get('/available' , async (req , res) =>{
      const date = req.query.date
      // Get All data From Service collection

      const services = await serviceCollection.find().toArray()

      // Get appointments of That Day

      const query = {date : date}

      const appointments = await appointmentCollection.find(query).toArray()

      // For Each Service
      services.forEach((service) => {
        const serviceAppointment = appointments.filter(appoint => appoint.treatment === service.name)

        const appointedSlots = serviceAppointment.map(app => app.slot)

        const available = service.slot.filter(slot1 => !appointedSlots.includes(slot1))
        console.log(available);
        service.slot = available
      });

      res.send(services)

    })

    app.post('/appointment' , async (req, res)=>{
      const ApData = req.body
      const query = {date : ApData.date ,slot : ApData.slot , email : ApData.email }
      const exists = await appointmentCollection.findOne(query)
      if (exists) {
        return res.send({ success: false, appointment: exists })
      }
      const result = await appointmentCollection.insertOne(ApData)

      res.send({success: true , result})
    })

    app.get('/appointment' , async (req , res) =>{
      const email = req.query.email
      const query = {email : email};
      const cursor = appointmentCollection.find(query)
      const result = await cursor.toArray();
      res.send(result)
    })
    app.delete('/appointment/:id' , async (req , res) => {
      const id = req.params.id
      const result = await appointmentCollection.deleteOne( { "_id" : ObjectId(id) } );
      console.log(result);
      res.send({deleted : true})
    })
    // 2118684145 2021
}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
  })
