const express = require('express');
const route = require('./routes/route');
const { default: mongoose } = require('mongoose');
const app = express();
const multer = require('multer')

app.use(express.json());
app.use(multer().any())

mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://Lucifer:lucifer123@newcluster.pifnz8c.mongodb.net/group23Database?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb Connected"))
    .catch(error => console.log(error))

app.use('/', route)

app.listen(process.env.PORT || 3000, function () {
    console.log('Express is connected on port ' + (process.env.PORT || 3000))
});