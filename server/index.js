const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Data file paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions to read/write JSON files
const readJSON = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

// ============ LEADS API ============

// Get all leads
app.get('/api/leads', (req, res) => {
  const leads = readJSON(LEADS_FILE);
  res.json(leads);
});

// Get single lead
app.get('/api/leads/:id', (req, res) => {
  const leads = readJSON(LEADS_FILE);
  const lead = leads.find(l => l.id === req.params.id);
  if (lead) {
    res.json(lead);
  } else {
    res.status(404).json({ error: 'Lead not found' });
  }
});

// Create lead
app.post('/api/leads', (req, res) => {
  const leads = readJSON(LEADS_FILE);
  const newLead = {
    ...req.body,
    id: req.body.id || Date.now().toString(),
    createdAt: req.body.createdAt || new Date().toISOString()
  };
  leads.unshift(newLead);
  if (writeJSON(LEADS_FILE, leads)) {
    res.status(201).json(newLead);
  } else {
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

// Update lead
app.put('/api/leads/:id', (req, res) => {
  const leads = readJSON(LEADS_FILE);
  const index = leads.findIndex(l => l.id === req.params.id);
  if (index !== -1) {
    leads[index] = { ...leads[index], ...req.body };
    if (writeJSON(LEADS_FILE, leads)) {
      res.json(leads[index]);
    } else {
      res.status(500).json({ error: 'Failed to update lead' });
    }
  } else {
    res.status(404).json({ error: 'Lead not found' });
  }
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
  const leads = readJSON(LEADS_FILE);
  const filtered = leads.filter(l => l.id !== req.params.id);
  if (filtered.length < leads.length) {
    if (writeJSON(LEADS_FILE, filtered)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete lead' });
    }
  } else {
    res.status(404).json({ error: 'Lead not found' });
  }
});

// Bulk save leads (replaces all)
app.post('/api/leads/bulk', (req, res) => {
  const leads = req.body;
  if (Array.isArray(leads)) {
    if (writeJSON(LEADS_FILE, leads)) {
      res.json({ success: true, count: leads.length });
    } else {
      res.status(500).json({ error: 'Failed to save leads' });
    }
  } else {
    res.status(400).json({ error: 'Expected array of leads' });
  }
});

// ============ USERS API ============

// Get all users
app.get('/api/users', (req, res) => {
  const users = readJSON(USERS_FILE);
  res.json(users);
});

// Get single user
app.get('/api/users/:id', (req, res) => {
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Create user
app.post('/api/users', (req, res) => {
  const users = readJSON(USERS_FILE);
  const newUser = {
    ...req.body,
    id: req.body.id || Date.now().toString(),
    createdAt: req.body.createdAt || new Date().toISOString(),
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  };
  users.unshift(newUser);
  if (writeJSON(USERS_FILE, users)) {
    res.status(201).json(newUser);
  } else {
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const users = readJSON(USERS_FILE);
  const index = users.findIndex(u => u.id === req.params.id);
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    if (writeJSON(USERS_FILE, users)) {
      res.json(users[index]);
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const users = readJSON(USERS_FILE);
  const filtered = users.filter(u => u.id !== req.params.id);
  if (filtered.length < users.length) {
    if (writeJSON(USERS_FILE, filtered)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Bulk save users (replaces all)
app.post('/api/users/bulk', (req, res) => {
  const users = req.body;
  if (Array.isArray(users)) {
    if (writeJSON(USERS_FILE, users)) {
      res.json({ success: true, count: users.length });
    } else {
      res.status(500).json({ error: 'Failed to save users' });
    }
  } else {
    res.status(400).json({ error: 'Expected array of users' });
  }
});

// ============ STATS API ============

app.get('/api/stats', (req, res) => {
  const leads = readJSON(LEADS_FILE);
  const users = readJSON(USERS_FILE);

  res.json({
    totalLeads: leads.length,
    totalUsers: users.length,
    leadsByStatus: leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {}),
    leadsByType: leads.reduce((acc, lead) => {
      acc[lead.leadType] = (acc[lead.leadType] || 0) + 1;
      return acc;
    }, {}),
    usersByRole: users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {})
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`CRM API Server running on http://localhost:${PORT}`);
  console.log(`Data stored in: ${DATA_DIR}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET/POST   /api/leads`);
  console.log(`  GET/PUT/DELETE /api/leads/:id`);
  console.log(`  POST       /api/leads/bulk`);
  console.log(`  GET/POST   /api/users`);
  console.log(`  GET/PUT/DELETE /api/users/:id`);
  console.log(`  POST       /api/users/bulk`);
  console.log(`  GET        /api/stats`);
});
