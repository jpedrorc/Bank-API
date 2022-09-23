const express = require('express');
const cors = require('cors');
const checkCPF = require('./tools/checkCPF');
const { v4: uuidv4 } = require('uuid');
const app = express();

const customers = [];

const today = new Date();
const time = `${today.getUTCDate()}-${today.getUTCMonth()}-${today.getFullYear()};`;
app.use(cors());
app.use(express.json());

function customerAlreadyExist(req, res, next) {
  if (!req.body) {
    return res.send('Por favor, insira um cpf e um nome para cadastro!');
  } else if (!req.body.cpf || !req.body.name) {
    return res.send('Por favor, insira o cpf e o nome corretamente!');
  }
  if (!checkCPF(req.body.cpf)) {
    return res.status(400).send('Por favor, insira um cpf válido');
  }
  if (
    (customerAlreadyExist = customers.some(
      (customer) => customer.cpf === req.body.cpf
    ))
  ) {
    return res
      .status(400)
      .send(`CPF:"${req.body.cpf}" already registered in the system.`);
  }
  next();
}

function checkExistClient(req, res, next) {
  const client = customers.find((customer) => [customer.id === req.params.id]);
  console.log(client);
  if (!client) {
    return res.send(`User "${req.params.id}" not found`);
  }
  next();
}
//CREATE CUSTOMER
app.post('/account/client/create', customerAlreadyExist, (req, res) => {
  const { cpf, name } = req.body;

  const extract = [{ time, transacao: 0 }];

  customers.push({ cpf, name, id: uuidv4(), balance: 0, extract });

  return res.status(201).send('Usuário criado com sucesso!');
});

//DEPOSIT
app.post(
  '/account/client/transaction/deposit/:id',
  checkExistClient,
  (req, res) => {
    const client = customers.find((customer) => [
      customer.id === req.params.id,
    ]);
    if (req.body.value == 0 || !req.body.value) {
      res.send('Please, enter the amount to be deposited.');
    }
    newExtract = { time, transacao: `+${req.body.value}` };
    client.balance += req.body.value;
    client.extract.push(newExtract);
    for (let i = 0; i < customers.length; i++) {
      if (customers[i].id == client.id) {
        customers[i] = client;
      }
    }
    res.status(200).send('Successful deposit');
  }
);

//WITHDRAWAL
app.post(
  '/account/client/transaction/withdraw/:id',
  checkExistClient,
  (req, res) => {
    const client = customers.find((customer) => [
      customer.id === req.params.id,
    ]);
    if (req.body.value == 0 || !req.body.value) {
      res.send('Please, enter the amount to be withdrawal.');
    }
    if (client.balance > req.body.value) {
      res.status(400).send('Insufficient funds');
    }
    newExtract = { time, transacao: `-${req.body.value}` };
    client.balance -= req.body.value;
    client.extract.push(newExtract);
    for (let i = 0; i < customers.length; i++) {
      if (customers[i].id == client.id) {
        customers[i] = client;
      }
    }
    res.status(200).send('Successful withdrawal');
  }
);

// GET CUSTOMERS
app.get('/account/client/', (req, res) => {
  return res.send(customers);
});

//GET ESPECIFIC CUSTOMER
app.get('/account/client/:id', checkExistClient, (req, res) => {
  const client = customers.find((customer) => customer.id === req.params.id);
  return res.send(client);
});

//GET EXTRACT OF ESPECIFIC CUSTOMER
app.get('/account/client/extract/:id', (req, res) => {
  const client = checkExistClient(customers, req.params.id);
  const extract = customers.find((customer) => {
    return customer.cpf === client.cpf;
  });
  if (extract) {
    return res.send(extract.extract);
  } else {
    return res.send('Usuário não encontrado');
  }
});

//GET EXTRACT OF ESPECIFIC TIME OF A CUSTOMER
app.get('/account/client/extract/:id/:date', (req, res) => {
  const client = checkExistClient(customers, req.params.id);
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].id == client.id) {
      for (let j = 0; j < customers.extract.length; j++) {
        if (customers.extract[j].time == req.params.date) {
          return res.send(customers.extract[j]);
        }
      }
      return res.send('Data não encontrada');
    }
    return res.send('Cliente não encontrado');
  }
});

//CHANGE CUSTOMER INFOS
app.put('/account/client/change/:id', (req, res) => {
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].id == req.params.id) {
      if (req.body.change == 'name' && req.body.newName != '') {
        customers[i].name = req.body.newName;
        return res.send('Nome alterado com sucesso');
      } else if (req.body.change == 'cpf' && req.body.newCpf != '') {
        customers[i].name = req.body.newCpf;
        return res.send('CPF alterado com sucesso');
      } else {
        return res.send(
          'Por favor, definir o que será alterado, e certificar do value correto!'
        );
      }
    }
    return res.send('Usuário não encontrado');
  }
});

//DELETE CUSTOMER
app.delete('/account/client/delete/:id', (req, res) => {
  if (checkExistClient(customers, req.params.id)) {
    customers.splice(checkExistClient(customers, req.params.id), 1);
    return res.send('Usuário apagado com sucesos.');
  }
  return res.send('Usuário não encontrado');
});

module.exports = app;
