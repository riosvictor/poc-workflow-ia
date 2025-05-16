import express from 'express';
import fs from 'fs-extra';
import path from 'path';

const app = express();
app.use(express.json());

const flowsDir = path.join(__dirname, '..', 'flows');

// crie a api flows, capaz de retornar o id e descrição de todos os fluxos disponíveis
app.get('/flows', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /flows`);
  const files = await fs.readdir(flowsDir);
  const flows = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(flowsDir, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile() && file.endsWith('.json')) {
        const flow = await fs.readJson(filePath);
        return { id: path.basename(file, '.json'), description: flow.description }
      }
    })
  );
  res.json(flows.filter(Boolean));
});

app.get('/flows/:id', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /flows/${req.params.id}`);
  const { id } = req.params;
  const filePath = path.join(flowsDir, `${id}.json`);
  if (await fs.pathExists(filePath)) {
    const flow = await fs.readJson(filePath);
    res.json(flow);
  } else {
    res.status(404).json({ error: 'Flow not found' });
  }
});

app.post('/flows/:id/execute', async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /flows/${req.params.id}/execute`, req.body);
  const { id } = req.params;
  const inputs = req.body;
  res.json({ status: 'executed', flow: id, inputs });
});

app.listen(3002, () => {
  console.log('Flow Orchestrator API listening on port 3002');
});
