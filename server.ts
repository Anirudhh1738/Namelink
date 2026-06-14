import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initDb, readEntries, writeEntries, validateIp, validateName } from "./src/server/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize JSON Database file safely
  await initDb();

  app.use(express.json());

  // API Route: Get all active / approved links for the homepage standard search & autocomplete
  app.get("/api/links", async (req, res) => {
    try {
      const entries = await readEntries();
      const approved = entries.filter((e) => e.approved);
      res.json(approved);
    } catch (err) {
      res.status(500).json({ error: "Failed to load active name links." });
    }
  });

  // API Route: Get all links (including pending ones) for the admin control panel
  app.get("/api/all-links", async (req, res) => {
    try {
      const entries = await readEntries();
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: "Failed to load database entries." });
    }
  });

  // API Route: Register / Submit a new redirect entry (defaults to pending approval)
  app.post("/api/links", async (req, res) => {
    try {
      const { name, ip, description } = req.body;

      if (!name || !ip) {
        return res.status(400).json({ error: "Please configure both the Custom Name and Target IP Address." });
      }

      const cleanName = name.trim().toLowerCase();
      if (!validateName(cleanName)) {
        return res.status(400).json({
          error: "Custom Name must be between 1 and 30 characters consisting strictly of letters, numbers, dashes, or underscores."
        });
      }

      const cleanIp = ip.trim();
      if (!validateIp(cleanIp)) {
        return res.status(400).json({
          error: "Invalid IP Target format. Must be an IPv4 Address, e.g., '192.168.1.100', optionally followed by a port, e.g., ':8080'."
        });
      }

      const entries = await readEntries();

      // Check if custom name is already reserved in the database or system
      const duplicate = entries.find((e) => e.name === cleanName);
      if (duplicate) {
        return res.status(400).json({ error: `The custom name '${cleanName}' has already been reserved.` });
      }

      const newEntry = {
        id: "lnk-" + Math.random().toString(36).substring(2, 11),
        name: cleanName,
        ip: cleanIp,
        description: description?.trim().slice(0, 200) || "",
        approved: false, // Requires admin panel authorization
        createdAt: new Date().toISOString()
      };

      entries.push(newEntry);
      await writeEntries(entries);

      res.status(201).json(newEntry);
    } catch (err) {
      res.status(500).json({ error: "Failed to register custom link." });
    }
  });

  // API Route: Approve a pending link (Admin Panel)
  app.put("/api/links/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const entries = await readEntries();
      const index = entries.findIndex((e) => e.id === id);

      if (index === -1) {
        return res.status(404).json({ error: "The selected entry does not exist." });
      }

      entries[index].approved = true;
      await writeEntries(entries);

      res.json(entries[index]);
    } catch (err) {
      res.status(500).json({ error: "Failed to approve the selected link." });
    }
  });

  // API Route: Edit custom link properties (Admin/User update)
  app.put("/api/links/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, ip, description, approved } = req.body;
      const entries = await readEntries();
      const index = entries.findIndex((e) => e.id === id);

      if (index === -1) {
        return res.status(404).json({ error: "The selected entry does not exist." });
      }

      if (!name || !ip) {
        return res.status(400).json({ error: "Name and IP Address fields cannot be empty." });
      }

      const cleanName = name.trim().toLowerCase();
      if (!validateName(cleanName)) {
        return res.status(400).json({ error: "Invalid layout for the Custom Name value." });
      }

      const cleanIp = ip.trim();
      if (!validateIp(cleanIp)) {
        return res.status(400).json({ error: "Invalid IP Address format." });
      }

      // Check for namespace collide excluding self
      const duplicate = entries.find((e) => e.name === cleanName && e.id !== id);
      if (duplicate) {
        return res.status(400).json({ error: `The custom name '${cleanName}' is already reserved by another link.` });
      }

      entries[index].name = cleanName;
      entries[index].ip = cleanIp;
      entries[index].description = description?.trim().slice(0, 200) || "";
      if (typeof approved === "boolean") {
        entries[index].approved = approved;
      }

      await writeEntries(entries);
      res.json(entries[index]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update target entry." });
    }
  });

  // API Route: Permanently delete a link mapping
  app.delete("/api/links/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const entries = await readEntries();
      const filtered = entries.filter((e) => e.id !== id);

      if (filtered.length === entries.length) {
        return res.status(404).json({ error: "The entry could not be found." });
      }

      await writeEntries(filtered);
      res.json({ success: true, message: "NameLink entry deleted successfully from DNS archives." });
    } catch (err) {
      res.status(500).json({ error: "Failed to process archival removal." });
    }
  });

  // Short DNS-style resolver route: e.g. accessing http://localhost:3000/r/myshop
  app.get("/r/:name", async (req, res) => {
    try {
      const name = req.params.name.trim().toLowerCase();
      const entries = await readEntries();
      const entry = entries.find((e) => e.name === name);

      if (!entry) {
        return res.redirect(`/?error=not_found&name=${encodeURIComponent(name)}`);
      }

      if (!entry.approved) {
        return res.redirect(`/?error=pending&name=${encodeURIComponent(name)}`);
      }

      let target = entry.ip.trim();
      // Ensure browser can execute correct location redirection
      if (!/^https?:\/\//i.test(target)) {
        target = `http://${target}`;
      }

      return res.redirect(target);
    } catch (err) {
      return res.redirect("/?error=internal_redirect");
    }
  });

  // Mount Vite assets and server bundle handling
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`⚡️ [NameLink Server] running on http://localhost:${PORT}`);
  });
}

startServer();
