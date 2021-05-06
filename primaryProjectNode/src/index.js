const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

function verifiyIfExistsAccountCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf == cpf);

  if (!customer) {
    return res.status(404).json({ error: 'account not found!' });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post('/account', (req, res) => {
  const { cpf, name, statement } = req.body;

  const customerAlreadyExists = customers.some((account) => account.cpf == cpf);

  if (customerAlreadyExists) {
    return res.json({ error: 'Costumer exists' });
  }

  const custumer = {
    id: uuidv4(),
    name,
    cpf,
    statement: statement ? [statement] : [],
  };

  customers.push(custumer);

  return res.status(201).json(custumer);
});

app.get('/account', (req, res) => {
  return res.json(customers);
});

app.get('/statement', verifiyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);
});

app.post('/deposit', verifiyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post('/withdraw', verifiyIfExistsAccountCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const accountBalance = getBalance(customer.statement);

  if (amount > accountBalance) {
    return res.status(400).json({ error: 'balance insufficient' });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.get('/statement/date', verifiyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + ' 00:00');

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.put('/account', verifiyIfExistsAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return response.status(201).json(customer);
});

app.delete('/account', verifiyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(204).send();
});

app.get('/balance', verifiyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  return res.json(getBalance(customer.statement));
});

app.listen(3333, () => {
  console.log('Server is Running!');
});
