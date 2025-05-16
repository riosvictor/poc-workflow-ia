import express from 'express';

const app = express();
app.use(express.json());

const validOrgs = ['openai', 'google', 'meta', 'boticario'];
const validTeams = ['engineering', 'product', 'design', 'alquimia'];
const validUsers = ['alice', 'bob', 'carol', 'Fernando', 'Paulo'];

app.post('/validate/orgs', (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /validate/orgs`, req.body);
  const { value } = req.body;
  res.json({ valid: validOrgs.includes(value) });
});

app.post('/validate/teams', (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /validate/teams`, req.body);
  const { value } = req.body;
  res.json({ valid: validTeams.includes(value) });
});

app.post('/validate/users', (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /validate/users`, req.body);
  const { value } = req.body;
  const values = Array.isArray(value) ? value : [value];
  const allValid = values.every(v => validUsers.includes(v));
  res.json({ valid: allValid });
});

app.listen(3003, () => {
  console.log('Flow Validator API listening on port 3003');
});
