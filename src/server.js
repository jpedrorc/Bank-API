require('dotenv').config();
const app = require('./');
const newExtract = {};
console.log('App funcionando na porta 3000');
app.listen(process.env.PORT);
