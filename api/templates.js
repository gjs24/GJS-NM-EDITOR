import { getDb } from './db.js';

export default async function handler(req, res) {
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

  const sql = getDb();
  if (!sql) {
    return res.status(200).json([]);
  }

  try {
    if (req.method === 'GET') {
      const isAll = req.query.all === 'true';
      let rows;
      if (isAll) {
        rows = await sql`SELECT * FROM templates ORDER BY updated_at DESC`;
      } else {
        rows = await sql`SELECT * FROM templates WHERE published = true ORDER BY updated_at DESC`;
      }

      const formatted = rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description,
        aspectRatio: r.aspect_ratio,
        baseWidth: r.base_width,
        baseHeight: r.base_height,
        backgroundColor: r.background_color,
        backgroundType: r.background_type,
        backgroundImageUrl: r.background_image_url,
        backgroundSecondaryColor: r.background_secondary_color,
        borderColor: r.border_color,
        borderWidth: r.border_width,
        borderRadius: r.border_radius,
        showBolts: r.show_bolts,
        innerBorder: r.inner_border,
        innerBorderColor: r.inner_border_color,
        innerBorderPadding: r.inner_border_padding,
        isTextureSheet: r.is_texture_sheet,
        textureResolution: r.texture_resolution,
        published: r.published,
        isPaid: r.is_paid,
        price: Number(r.price || 0),
        currency: r.currency || 'INR',
        fields: r.fields || [],
        fixedGraphics: r.fixed_graphics || [],
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));

      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const t = req.body;
      if (!t?.id || !t?.name) {
        return res.status(400).json({ error: 'Missing template ID or name.' });
      }

      await sql`
        INSERT INTO templates (
          id, name, category, description, aspect_ratio, base_width, base_height,
          background_color, background_type, background_image_url, background_secondary_color,
          border_color, border_width, border_radius, show_bolts, inner_border,
          inner_border_color, inner_border_padding, is_texture_sheet, texture_resolution,
          published, is_paid, price, currency, fields, fixed_graphics, updated_at
        ) VALUES (
          ${t.id}, ${t.name}, ${t.category || 'LED Texture Sheet'}, ${t.description || ''},
          ${t.aspectRatio || '1:1'}, ${Number(t.baseWidth || 1024)}, ${Number(t.baseHeight || 1024)},
          ${t.backgroundColor || '#0c0f12'}, ${t.backgroundType || 'transparent'},
          ${t.backgroundImageUrl || null}, ${t.backgroundSecondaryColor || null},
          ${t.borderColor || 'transparent'}, ${Number(t.borderWidth || 0)}, ${Number(t.borderRadius || 0)},
          ${Boolean(t.showBolts)}, ${Boolean(t.innerBorder)}, ${t.innerBorderColor || null},
          ${Number(t.innerBorderPadding || 6)}, ${Boolean(t.isTextureSheet)}, ${Number(t.textureResolution || 1024)},
          ${t.published !== false}, ${Boolean(t.isPaid)}, ${Number(t.price || 0)}, ${t.currency || 'INR'},
          ${JSON.stringify(t.fields || [])}, ${JSON.stringify(t.fixedGraphics || [])}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          aspect_ratio = EXCLUDED.aspect_ratio,
          base_width = EXCLUDED.base_width,
          base_height = EXCLUDED.base_height,
          background_color = EXCLUDED.background_color,
          background_type = EXCLUDED.background_type,
          background_image_url = EXCLUDED.background_image_url,
          background_secondary_color = EXCLUDED.background_secondary_color,
          border_color = EXCLUDED.border_color,
          border_width = EXCLUDED.border_width,
          border_radius = EXCLUDED.border_radius,
          show_bolts = EXCLUDED.show_bolts,
          inner_border = EXCLUDED.inner_border,
          inner_border_color = EXCLUDED.inner_border_color,
          inner_border_padding = EXCLUDED.inner_border_padding,
          is_texture_sheet = EXCLUDED.is_texture_sheet,
          texture_resolution = EXCLUDED.texture_resolution,
          published = EXCLUDED.published,
          is_paid = EXCLUDED.is_paid,
          price = EXCLUDED.price,
          currency = EXCLUDED.currency,
          fields = EXCLUDED.fields,
          fixed_graphics = EXCLUDED.fixed_graphics,
          updated_at = NOW();
      `;

      return res.status(200).json(t);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) return res.status(400).json({ error: 'Missing template ID' });

      await sql`DELETE FROM templates WHERE id = ${id}`;
      return res.status(200).json({ success: true, deletedId: id });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Neon templates error:', error);
    return res.status(500).json({ error: error.message });
  }
}

