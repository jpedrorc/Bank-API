const checkCPF = require('./tools/checkCPF');
const locateUser = require('./tools/locateUser');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();

const customers = [];

const today = new Date();
const time = `${today.getUTCDate()}-${today.getUTCMonth()}-${today.getFullYear()};`;

app.use(express.json());

app.post('/account/client/create', (req, res) => {
  if (!req.body) {
    return res.send('Por favor, insira um cpf e um nome para cadastro!');
  } else if (!req.body.cpf || !req.body.name) {
    return res.send('Por favor, insira o cpf e o nome corretamente!');
  }

  const { cpf, name } = req.body;

  const customerAlreadyExist = customers.some(
    (customer) => customer.cpf === cpf
  );
  if (customerAlreadyExist) {
    return res.status(400).send('CPF já cadastrado no sistema');
  }

  if (checkCPF(cpf) == false) {
    return res.status(400).send('Por favor, insira um cpf válido');
  }

  const extrato = [{ time, transacao: 0 }];

  customers.push({ cpf, name, id: uuidv4(), saldo: 0, extrato });

  return res.status(201).send('Usuário criado com sucesso!');
});

app.post('/account/client/transaction/:id', (req, res) => {
  const client = locateUser(customers, req.params.id);
  console.log(client);
  let newExtract = {};
  if (client == null) {
    res.send('Cliente não encontrado');
  }
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

app.get('/account/client/:id', (req, res) => {
  if (locateUser(customers, req.params.id)) {
    return res.send(locateUser(customers, req.params.id));
  }
  return res.send('Usuário não encontrado');
});

app.get('/account/client/extract/:id', (req, res) => {
  const client = locateUser(customers, req.params.id);
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
  const client = locateUser(customers, req.params.id);
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
  if (locateUser(customers, req.params.id)) {
    customers.splice(locateUser(customers, req.params.id), 1);
    return res.send('Usuário apagado com sucesos.');
  }
  return res.send('Usuário não encontrado');
});

app.listen(3030);
