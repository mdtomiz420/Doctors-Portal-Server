const getService = (collection , app) =>{
    app.get('/services', async (req, res) => {
        const query = {};
        const cursor = collection.find(query)
        const services = await cursor.toArray();
        res.send(services)
        
      })
}
module.exports = getService