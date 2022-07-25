const checkCPF = require('./tools/checkCPF');
const locateUser = require('./tools/locateUser');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();

const costumers = [];

var today = new Date();
var time = `${today.getUTCDate()}-${today.getUTCMonth()}-${today.getFullYear()};`;

app.use(express.json());

app.post('/account/client/create', (req, res) => {
  if (!req.body) {
    return res.send('Por favor, insira um cpf e um nome para cadastro!');
  } else if (!req.body.cpf || !req.body.name) {
    return res.send('Por favor, insira o cpf e o nome corretamente!');
  }

  const { cpf, name } = req.body;
  for (let i = 0; i < costumers.length; i++) {
    if ((costumers[i].cpf = cpf)) {
      return res.send('CPF já cadastrado no sistema');
    }
  }
  if (checkCPF(cpf) == false) {
    return res.send('Por favor, insira um cpf válido');
  }

  const id = uuidv4();
  const extrato = [{ time, transacao: 0 }];

  costumers.push({ cpf, name, id, saldo: 0, extrato });

  return res.status(201).send('Usuário criado com sucesso!');
});

app.post('/account/client/transaction/:id', (req, res) => {
  const client = locateUser(costumers, req.params.id);
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

  for (let i = 0; i < costumers.length; i++) {
    if (costumers[i].id == client.id) {
      costumers[i] = client;
      res.send('Transação feita com sucesso');
    }
  }
});

app.get('/account/client/', (req, res) => {
  return res.send(costumers);
});

app.get('/account/client/:id', (req, res) => {
  if (locateUser(costumers, req.params.id)) {
    return res.send(locateUser(costumers, req.params.id));
  }
  return res.send('Usuário não encontrado');
});

app.get('/account/client/extract/:id', (req, res) => {
  const client = locateUser(costumers, req.params.id);
  for (let i = 0; i < costumers.length; i++) {
    if (costumers[i].id == client.id) {
      return res.send(costumers[i].extrato);
    }
  }
});

app.get('/account/client/extract/:id/:date', (req, res) => {
  const client = locateUser(costumers, req.params.id);
  for (let i = 0; i < costumers.length; i++) {
    if (costumers[i].id == client.id) {
      for (let j = 0; j < costumers.extrato.length; j++) {
        if (costumers.extrato[j].time == req.params.date) {
          return res.send(costumers.extrato[j]);
        }
      }
      return res.send('Data não encontrada');
    }
    return res.send('Cliente não encontrado');
  }
});

app.put('/account/client/change/:id', (req, res) => {
  for (let i = 0; i < costumers.length; i++) {
    if (costumers[i].id == req.params.id) {
      if (req.body.change == 'name' && req.body.newName != '') {
        costumers[i].name = req.body.newName;
        return res.send('Nome alterado com sucesso');
      } else if (req.body.change == 'cpf' && req.body.newCpf != '') {
        costumers[i].name = req.body.newCpf;
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
  if (locateUser(costumers, req.params.id)) {
    costumers.splice(locateUser(costumers, req.params.id), 1);
    return res.send('Usuário apagado com sucesos.');
  }
  return res.send('Usuário não encontrado');
});

app.listen(3030);
