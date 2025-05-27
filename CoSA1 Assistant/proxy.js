export default async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }
  
    // Parse the body
    let body;
    try {
      body = req.body;
      if (typeof body === "string") {
        body = JSON.parse(body);
      }
    } catch (e) {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }
  
    const apiUrl = "https://discoveryengine.googleapis.com/v1alpha/projects/310961014296/locations/global/collections/default_collection/engines/cosa1_1748271255057/servingConfigs/default_search:search";
  
    try {
      const apiResp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
          // Add authentication headers here if needed
        },
        body: JSON.stringify(body),
      });
  
      const data = await apiResp.json();
      res.status(apiResp.status).json(data);
    } catch (e) {
      res.status(500).json({ error: "Proxy request failed", details: e.message });
    }
  };