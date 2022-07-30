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
  if (checkCPF(req.body.cpf) === false) {
    return res.status(400).send('Por favor, insira um cpf válido');
  }
  if (
    (customerAlreadyExist = customers.some(
      (customer) => customer.cpf === req.body.cpf
    ))
  ) {
    return res
      .status(400)
      .send(`CPF "${req.body.cpf}" já é cadastrado no sistema.`);
  }
  next();
}

function checkExistClient(req, res, next) {
  const client = customers.find((customer) => [customer.id === req.params.id]);
  if (!client) {
    return res.send(`Usuário "${req.params.id}" não encontrado`);
  }
  next();
}

app.post('/account/client/create', customerAlreadyExist, (req, res) => {
  const { cpf, name } = req.body;

  const extrato = [{ time, transacao: 0 }];

  customers.push({ cpf, name, id: uuidv4(), saldo: 0, extrato });

  return res.status(201).send('Usuário criado com sucesso!');
});

app.post('/account/client/transaction/:id', checkExistClient, (req, res) => {
  let newExtract = {};
  if (req.body.valor == 0 || req.body.move == '') {
    res.send(
      'Por favor informe o valor a ser movimentado e se é saque ou deposito!!'
    );
  }
  if (req.body.move == 'saque' && req.body.valor > client.saldo) {
    res.send('Valor de saque superior ao saldo disponivel.');
  }
  if (req.body.move == 'saque' && client.saldo > 0) {
    newExtract = { time, transacao: `-${req.body.valor}` };
    client.saldo -= req.body.valor;
  } else {
    newExtract = { time, transacao: `+${req.body.valor}` };
    client.saldo += req.body.valor;
  }
  client.extrato.push(newExtract);

  for (let i = 0; i < customers.length; i++) {
    if (customers[i].id == client.id) {
      customers[i] = client;
      res.send('Transação feita com sucesso');
    }
  }
});

app.get('/account/client/', (req, res) => {
  return res.send(customers);
});

app.get('/account/client/:id', checkExistClient, (req, res) => {
  const client = customers.find((customer) => customer.id === req.params.id);
  return res.send(client);
});

app.get('/account/client/extract/:id', (req, res) => {
  const client = checkExistClient(customers, req.params.id);
  const extract = customers.find((customer) => {
    return customer.cpf === client.cpf;
  });
  if (extract) {
    return res.send(extract.extrato);
  } else {
    return res.send('Usuário não encontrado');
  }
});

app.get('/account/client/extract/:id/:date', (req, res) => {
  const client = checkExistClient(customers, req.params.id);
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].id == client.id) {
      for (let j = 0; j < customers.extrato.length; j++) {
        if (customers.extrato[j].time == req.params.date) {
          return res.send(customers.extrato[j]);
        }
      }
      return res.send('Data não encontrada');
    }
    return res.send('Cliente não encontrado');
  }
});

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
          'Por favor, definir o que será alterado, e certificar do valor correto!'
        );
      }
    }
    return res.send('Usuário não encontrado');
  }
});

app.delete('/account/client/delete/:id', (req, res) => {
  if (checkExistClient(customers, req.params.id)) {
    customers.splice(checkExistClient(customers, req.params.id), 1);
    return res.send('Usuário apagado com sucesos.');
  }
  return res.send('Usuário não encontrado');
});

module.exports = app;
