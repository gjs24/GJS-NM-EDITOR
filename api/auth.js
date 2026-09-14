import crypto from 'crypto';
import { getDb } from './db.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_gjs_salt_2026').digest('hex');
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, name, email, password, avatarUrl } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();

  // If no Neon DB connected, return graceful offline response
  const sql = getDb();

  // Helper to generate consistent avatar URL
  const getAvatar = (userEmail, userName, customAvatar) => {
    if (customAvatar) return customAvatar;
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName || userEmail || 'railway')}`;
  };

  // Helper to generate random 4-digit User ID
  const generateUserId = () => {
    return `USR-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  try {
    // -------------------------------------------------------------
    // ACTION: REGISTER (Create Account)
    // -------------------------------------------------------------
    if (action === 'register') {
      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const displayName = (name || '').trim() || normalizedEmail.split('@')[0];
      const assignedUserId = generateUserId();
      const userAvatar = getAvatar(normalizedEmail, displayName, avatarUrl);
      const passwordHash = hashPassword(password);
      const internalId = `usr_${Date.now()}`;

      if (sql) {
        // Ensure users table exists
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            avatar_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        // Check if user already exists
        const existing = await sql`
          SELECT id, email FROM users WHERE LOWER(email) = ${normalizedEmail} LIMIT 1;
        `;

        if (existing.length > 0) {
          return res.status(400).json({ error: 'An account with this email address already exists. Please Sign In.' });
        }

        // Insert new user
        await sql`
          INSERT INTO users (
            id, user_id, name, email, password_hash, avatar_url
          ) VALUES (
            ${internalId}, ${assignedUserId}, ${displayName}, ${normalizedEmail}, ${passwordHash}, ${userAvatar}
          );
        `;
      }

      return res.status(200).json({
        success: true,
        user: {
          id: internalId,
          userId: assignedUserId,
          name: displayName,
          email: normalizedEmail,
          avatarUrl: userAvatar,
          purchasedTemplateIds: [],
          createdAt: new Date().toISOString()
        }
      });
    }

    // -------------------------------------------------------------
    // ACTION: LOGIN (Sign In)
    // -------------------------------------------------------------
    if (action === 'login') {
      if (!normalizedEmail) {
        return res.status(400).json({ error: 'Please enter your email or User ID.' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Please enter your password.' });
      }

      if (sql) {
        // Find user by email or user_id
        const users = await sql`
          SELECT * FROM users
          WHERE LOWER(email) = ${normalizedEmail} OR UPPER(user_id) = ${normalizedEmail.toUpperCase()}
          LIMIT 1;
        `;

        if (users.length === 0) {
          return res.status(401).json({ error: 'Account not found. Please check your credentials or create an account.' });
        }

        const userRow = users[0];
        const enteredHash = hashPassword(password);

        if (userRow.password_hash && userRow.password_hash !== enteredHash) {
          return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }

        // Fetch user's purchased templates from Neon
        const purchases = await sql`
          SELECT template_id FROM user_purchases
          WHERE (user_id = ${userRow.user_id} OR user_id = ${userRow.id}) AND status = 'SUCCESS';
        `;
        const purchasedTemplateIds = purchases.map((p) => p.template_id);

        return res.status(200).json({
          success: true,
          user: {
            id: userRow.id,
            userId: userRow.user_id,
            name: userRow.name,
            email: userRow.email,
            avatarUrl: userRow.avatar_url || getAvatar(userRow.email, userRow.name),
            purchasedTemplateIds,
            createdAt: userRow.created_at
          }
        });
      }

      // Offline fallback:
      return res.status(200).json({
        success: true,
        offline: true,
        user: {
          id: `usr_${Date.now()}`,
          userId: generateUserId(),
          name: normalizedEmail.split('@')[0],
          email: normalizedEmail,
          avatarUrl: getAvatar(normalizedEmail, normalizedEmail.split('@')[0]),
          purchasedTemplateIds: [],
          createdAt: new Date().toISOString()
        }
      });
    }

    // -------------------------------------------------------------
    // ACTION: GOOGLE SIGN-IN
    // -------------------------------------------------------------
    if (action === 'google') {
      if (!normalizedEmail) {
        return res.status(400).json({ error: 'Email is required for Google Sign-In.' });
      }

      const displayName = (name || '').trim() || normalizedEmail.split('@')[0];
      const userAvatar = getAvatar(normalizedEmail, displayName, avatarUrl);

      if (sql) {
        // Ensure users table exists
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            avatar_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        const existing = await sql`
          SELECT * FROM users WHERE LOWER(email) = ${normalizedEmail} LIMIT 1;
        `;

        let userRow;
        if (existing.length > 0) {
          userRow = existing[0];
          // Update avatar if newer
          if (avatarUrl && userRow.avatar_url !== avatarUrl) {
            await sql`UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${userRow.id};`;
          }
        } else {
          const assignedUserId = generateUserId();
          const internalId = `usr_${Date.now()}`;
          await sql`
            INSERT INTO users (
              id, user_id, name, email, avatar_url
            ) VALUES (
              ${internalId}, ${assignedUserId}, ${displayName}, ${normalizedEmail}, ${userAvatar}
            );
          `;
          userRow = {
            id: internalId,
            user_id: assignedUserId,
            name: displayName,
            email: normalizedEmail,
            avatar_url: userAvatar,
            created_at: new Date().toISOString()
          };
        }

        // Fetch purchases
        const purchases = await sql`
          SELECT template_id FROM user_purchases
          WHERE (user_id = ${userRow.user_id} OR user_id = ${userRow.id}) AND status = 'SUCCESS';
        `;
        const purchasedTemplateIds = purchases.map((p) => p.template_id);

        return res.status(200).json({
          success: true,
          user: {
            id: userRow.id,
            userId: userRow.user_id,
            name: userRow.name,
            email: userRow.email,
            avatarUrl: userRow.avatar_url || userAvatar,
            purchasedTemplateIds,
            createdAt: userRow.created_at
          }
        });
      }

      // Offline fallback:
      return res.status(200).json({
        success: true,
        offline: true,
        user: {
          id: `usr_${Date.now()}`,
          userId: generateUserId(),
          name: displayName,
          email: normalizedEmail,
          avatarUrl: userAvatar,
          purchasedTemplateIds: [],
          createdAt: new Date().toISOString()
        }
      });
    }

    return res.status(400).json({ error: 'Invalid action. Supported: register, login, google' });
  } catch (err) {
    console.error('API /auth error:', err);
    return res.status(500).json({ error: 'Authentication server error: ' + err.message });
  }
}
