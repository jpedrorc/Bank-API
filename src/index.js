const express = require('express');
const cors = require('cors');
// const checkCPF = require('./tools/checkCPF');
const { v4: uuidv4 } = require('uuid');
const app = express();

const customers = [];

const today = new Date();
const time = `${today.getUTCDate()}-${today.getUTCMonth()}-${today.getFullYear()};`;
app.use(cors());
app.use(express.json());

function customerAlreadyExist(req, res, next) {
  if (!req.body) {
    return res
      .status(400)
      .send('Please, enter a cpf and a name for registration');
  } else if (!req.body.cpf || !req.body.name) {
    return res.status(400).send('Please enter a correctly cpf and name');
  }
  // if (!checkCPF(req.body.cpf)) {
  //   return res.status(400).send('Please, enter a valid cpf');
  // }
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
  if (!req.headers.cpf) {
    res.send('Please enter a cpf');
  }
  const client = customers.find((customer) => [
    customer.cpf === req.headers.cpf,
  ]);
  if (!client) {
    return res.send(`User "${req.headers.cpf}" not found`);
  }
  next();
}

//CREATE CUSTOMER
app.post('/account/client/create', customerAlreadyExist, (req, res) => {
  const { cpf, name } = req.body;

  const extract = [{ time, transacao: 0 }];

  customers.push({ cpf, name, id: uuidv4(), balance: 0, extract });

  return res.status(201).send('User created successfully');
});

//DEPOSIT
app.post(
  '/account/client/transaction/deposit',
  checkExistClient,
  (req, res) => {
    if (req.body.value == 0 || !req.body.value) {
      res.status(400).send('Please, enter the amount to be deposited.');
    }
    newExtract = { time, transacao: `+${req.body.value}` };
    for (let i = 0; i < customers.length; i++) {
      if (customers[i].cpf == req.headers.cpf) {
        customers[i].balance = customers[i].balance + req.body.value;
        customers[i].extract.push(newExtract);
      }
    }
    res.status(200).send('Successful deposit');
  }
);

//WITHDRAWAL
app.post(
  '/account/client/transaction/withdraw',
  checkExistClient,
  (req, res) => {
    if (req.body.value == 0 || !req.body.value) {
      res.send('Please, enter the amount to be withdrawal.');
    }
    newExtract = { time, transacao: `-${req.body.value}` };
    for (let i = 0; i < customers.length; i++) {
      if (customers[i].cpf == req.headers.cpf) {
        if (customers[i].balance < req.body.value) {
          res.status(400).send('Insufficient funds');
        }
        customers[i].balance = customers[i].balance - req.body.value;
        customers[i].extract.push(newExtract);
      }
    }
    res.status(200).send('Successful withdrawal');
  }
);

//GET CUSTOMER/ESPECIFIC CUSTOMER
app.get('/account/client', (req, res) => {
  if (!req.headers.cpf) {
    return res.status(200).send(customers);
  }
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].cpf === req.headers.cpf) {
      return res
        .status(200)
        .send(customers.find((customer) => customer.cpf === req.headers.cpf));
    }
  }
  res.status(400).send('CPF not found');
});

//GET EXTRACT OF ESPECIFIC CUSTOMER
app.get('/account/client/extract', checkExistClient, (req, res) => {
  const extract = customers.find((customer) => {
    return customer.cpf === req.headers.cpf;
  });
  return res.status(200).send(extract.extract);
});

//GET EXTRACT OF ESPECIFIC TIME OF A CUSTOMER
app.get('/account/client/extract', checkExistClient, (req, res) => {
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].cpf == req.headers.cpf) {
      for (let j = 0; j < customers.extract.length; j++) {
        if (customers.extract[j].time == req.headers.date) {
          return res.status(200).send(customers.extract[j]);
        }
      }
      return res.status(204).send('Date not found');
    }
  }
});

//CHANGE CUSTOMER INFOS
app.put('/account/client/change/name', checkExistClient, (req, res) => {
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].cpf == req.headers.cpf) {
      customers[i].name = req.body.newName;
      return res.status(200).send('Name changed successfully');
    }
  }
});

app.put('/account/client/change/cpf', checkExistClient, (req, res) => {
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].cpf == req.headers.cpf) {
      customers[i].cpf = req.body.newCpf;
      return res.status(200).send('CPF changed successfully');
    }
  }
});

//DELETE CUSTOMER
app.delete('/account/client/delete', checkExistClient, (req, res) => {
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].cpf === req.headers.cpf) {
      customers.splice(i, 1);
      return res.status(200).send('User deleted successfully.');
    }
  }
});

module.exports = app;
