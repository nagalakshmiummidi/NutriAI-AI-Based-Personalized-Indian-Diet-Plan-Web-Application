const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const rpName = 'NutriPlan';
const rpID = process.env.RP_ID || '127.0.0.1';
const origin = process.env.ORIGIN || 'http://127.0.0.1:3001';

// In-memory stores (demo only)
const users = {}; // userId -> { id, username, credentials: [] }
const challenges = {}; // userId -> challenge
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'users.json');

function loadUsers() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      Object.assign(users, parsed);
      console.log('Loaded users from users.json');
    }
  } catch (err) {
    console.warn('Could not load users.json:', err.message);
  }
}

function saveUsers() {
  try {
    // create a timestamped backup of existing DB
    try {
      if (fs.existsSync(DB_PATH)) {
        const bakPath = DB_PATH + '.bak';
        fs.copyFileSync(DB_PATH, bakPath);
      }
    } catch (e) {
      console.warn('Could not create backup users.json.bak:', e.message);
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write users.json:', err.message);
  }
}

// Load on startup
loadUsers();

app.post('/generate-registration-options', (req, res) => {
  const { userId, username } = req.body;
  if (!userId || !username) return res.status(400).send({ error: 'missing userId or username' });

  const existingUser = users[userId] || { id: userId, username, credentials: [] };

  const options = generateRegistrationOptions({
    rpName,
    rpID,
    userID: existingUser.id,
    userName: existingUser.username,
    timeout: 60000,
    attestationType: 'indirect',
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'discouraged',
    },
  });

  challenges[userId] = options.challenge;
  users[userId] = existingUser;

  res.json(options);
});

app.post('/verify-registration', async (req, res) => {
  const { userId, attestationResponse } = req.body;
  if (!userId || !attestationResponse) return res.status(400).send({ error: 'missing fields' });

  const expectedChallenge = challenges[userId];
  try {
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    const { verified, registrationInfo } = verification;
    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = registrationInfo;
      // store credentialID and publicKey as base64url strings to make JSON transport safe
      const idBase64 = Buffer.from(credentialID).toString('base64url');
      const pkBase64 = Buffer.from(credentialPublicKey).toString('base64url');
      const createdAt = new Date().toISOString();
      users[userId].credentials.push({ credentialID: idBase64, credentialPublicKey: pkBase64, counter, createdAt });
      // persist
      saveUsers();
      delete challenges[userId];
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.post('/generate-authentication-options', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).send({ error: 'missing userId' });

  const user = users[userId];
  if (!user) return res.status(404).send({ error: 'user not found' });

  // allowCredentials should contain base64url IDs (client will convert to ArrayBuffer)
  const allowCredentials = user.credentials.map((c) => ({ id: c.credentialID, type: 'public-key' }));

  const options = generateAuthenticationOptions({
    timeout: 60000,
    allowCredentials,
    userVerification: 'preferred',
    rpID,
  });

  challenges[userId] = options.challenge;
  res.json(options);
});

app.post('/verify-authentication', async (req, res) => {
  const { userId, assertionResponse } = req.body;
  if (!userId || !assertionResponse) return res.status(400).send({ error: 'missing fields' });

  const expectedChallenge = challenges[userId];
  const user = users[userId];
  if (!user) return res.status(404).send({ error: 'user not found' });

  try {
    // Find stored credential by base64url id
    const dbCred = user.credentials.find((c) => c.credentialID === assertionResponse.id);
    // If found, build authenticator object with Buffers
    let authenticator = undefined;
    if (dbCred) {
      authenticator = {
        credentialPublicKey: Buffer.from(dbCred.credentialPublicKey, 'base64url'),
        credentialID: Buffer.from(dbCred.credentialID, 'base64url'),
        counter: dbCred.counter || 0,
      };
    }

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator,
    });

    const { verified, authenticationInfo } = verification;
    if (verified) {
      // update counter in stored credential
      if (authenticationInfo && authenticationInfo.newCounter != null && dbCred) {
        dbCred.counter = authenticationInfo.newCounter;
        saveUsers();
      }
      delete challenges[userId];
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Return stored credentials for a user (demo endpoint)
app.get('/user-credentials', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'missing userId' });
  const user = users[userId];
  if (!user) return res.status(404).json({ error: 'user not found' });

  // Return a minimal view safe for JSON transport
  const credentials = user.credentials.map((c) => ({ id: c.credentialID, counter: c.counter || 0 }));
  res.json({ credentials });
});

// Delete a stored credential for a user
app.delete('/user-credentials', (req, res) => {
  const { userId, credentialId } = req.body;
  if (!userId || !credentialId) return res.status(400).json({ error: 'missing userId or credentialId' });
  const user = users[userId];
  if (!user) return res.status(404).json({ error: 'user not found' });

  const idx = user.credentials.findIndex((c) => c.credentialID === credentialId);
  if (idx === -1) return res.status(404).json({ error: 'credential not found' });

  user.credentials.splice(idx, 1);
  saveUsers();
  res.json({ ok: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`WebAuthn server listening on http://localhost:${port}`));
