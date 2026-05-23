export default {
  /*
  example data:
  [
    {
      "vakken":
      [
        {
          "name": "Scheikunde",
          "se_cijfer": 7.3,
          "oefenexamens":
          {
            "2020-I": [7.5, "8-12-2020"],
            "2020-II": [8, "8-12-2020"],
            "2021-I": [7, "8-12-2021"]
          },
          "weaknesses":
          {
            "Organische Chemie": true,
            "Zuur-Base Evenwichten": false,
            "Redoxreacties": true
          }
        },
        {
          "name": "Natuurkunde",
          "se_cijfer": 7.2,
          "oefenexamens":
          {
            "2020-I": [7.5, "8-12-2020"],
            "2020-II": [8, "8-12-2020"],
            "2021-I": [7, "8-12-2021"]
          },
          "weaknesses":
          {
            "Mechanica": true,
            "Elektriciteit": false,
            "Golven": true
          }
        }
      ]
    }
  ]
  */

/*
Default (voor copypaste)
{
  "vakken": [
    { "name": "Wiskunde B", "se_grade": 8.0, "oefenexamens": {}, "weaknesses": {} },
    { "name": "Nederlands", "se_grade": 8.0, "oefenexamens": {}, "weaknesses": {} },
    { "name": "Engels", "se_grade": 8.0, "oefenexamens": {}, "weaknesses": {} },
    { "name": "Biologie", "se_grade": 8.0, "oefenexamens": {}, "weaknesses": {} },
    { "name": "Natuurkunde", "se_grade": 8.0, "oefenexamens": {}, "weaknesses": {} },
    { "name": "Scheikunde", "se_grade": 8.0, "oefenexamens": {}, "weaknesses": {} },
    { "name": "Latijn", "se_grade": 8.0, "oefenexamens": {}, "weaknesses": {} },
    { "name": "Duits", "se_grade": 8.0, "oefenexamens": {}, "weaknesses": {} }
  ]
}
 */

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Helper: hash een wachtwoord
    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
    }

    // Helper: genereer een token voor sessie
    function generateToken(username){
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2,11);
      return `${username}:${timestamp}:${random}`;
    }

    // Helper: verify de format van een token
    function verifyToken(token) {
      const parts = token.split(":");
      if (parts.length !== 3) return null;
      return parts[0]; // Return username
    }

    // Helper: haal token uit header
    function getAuthToken(request){
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
      return authHeader.substring(7);
    }
    
    // Test
    if (url.pathname === "/test") {
      return new Response("Test" + await env.examentracker_db.get("data"));
    }

    if (url.pathname === "/get-version") {
      const { id: versionId, tag: versionTag, timestamp: versionTimestamp } = env.CF_VERSION_METADATA;
      let croppedId = versionId.slice(0, 8);
      return new Response(`${croppedId}`);
    }
    
    // Registreren
    if (url.pathname === "/register" && request.method === "POST") {
      try {
        const { username, password } = await request.json();

        if (!username || !password) {
          return new Response(JSON.stringify({ error: "Gebruikersnaam en wachtwoord zijn verplicht." }), { status: 400 });
        }

        // Check of gebruiker al bestaat
        const existingUser = await env.examentracker_db.get(`users:${username}`);
        if (existingUser) {
          return new Response(JSON.stringify({ error: "Gebruikersnaam is al in gebruik." }), { status: 400 });
        }

        // Hash wachtwoord
        const hashedPassword = hashPassword(password);

        // Sla gebruiker op
        const user = { username, password: hashedPassword };
        await env.examentracker_db.put(`users:${username}`, JSON.stringify(user));

        // Maak lege userdata
        const defaultData = {
          vakken: [
            { name: "Wiskunde B", se_grade: 8.0, oefenexamens: {}, weaknesses: [] },
            { name: "Nederlands", se_grade: 8.0, oefenexamens: {}, weaknesses: [] },
            { name: "Engels", se_grade: 8.0, oefenexamens: {}, weaknesses: [] },
            { name: "Biologie", se_grade: 8.0, oefenexamens: {}, weaknesses: [] },
            { name: "Natuurkunde", se_grade: 8.0, oefenexamens: {}, weaknesses: [] },
            { name: "Scheikunde", se_grade: 8.0, oefenexamens: {}, weaknesses: [] },
            { name: "Latijn", se_grade: 8.0, oefenexamens: {}, weaknesses: [] },
            { name: "Duits", se_grade: 8.0, oefenexamens: {}, weaknesses: [] }
          ]
        };
        await env.examentracker_db.put(`user-data:${username}`, JSON.stringify(defaultData));

        return new Response(JSON.stringify({ success: true,message: "Registratie succesvol." }));
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }

    // Login
    if (url.pathname === "/login" && request.method === "POST") {
      try {
        const { username, password } = await request.json();

        if (!username || !password) {
          return new Response(JSON.stringify({ error: "Gebruikersnaam en wachtwoord zijn verplicht." }), { status: 400 });
        }

        // Krijg user
        const userJson = await env.examentracker_db.get(`users:${username}`);
        if (!userJson) {
          return new Response(JSON.stringify({ error: "Ongeldige gebruikersnaam of wachtwoord." }), { status: 401 });
        }

        const user = JSON.parse(userJson);

        // Hash wachtwoord en vergelijk

        const hashedPassword = hashPassword(password);
        if (hashedPassword !== user.password) {
          return new Response(JSON.stringify({ error: "Ongeldige gebruikersnaam of wachtwoord." }), { status: 401 });
        }

        // Genereer token
        const token = generateToken(username);
        return new Response(JSON.stringify({ success: true, token, username }));
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }

    if (url.pathname === "/get-data" && request.method === "GET") {
      const token = getAuthToken(request);
      if (!token) {
        return new Response(JSON.stringify({ error: "Token is vereist." }), { status: 401 });
      }

      const username = verifyToken(token);
      if (!username) {
        return new Response(JSON.stringify({ error: "Ongeldig token." }), { status: 401 });
      }

      const dataJson = await env.examentracker_db.get(`user-data:${username}`);
      if (!dataJson) {
        return new Response(JSON.stringify({ error: "Geen data gevonden voor deze gebruiker." }), { status: 404 });
      }

      const data = JSON.parse(dataJson);
      return new Response(JSON.stringify(data));
    }

    if (url.pathname === "/update-data" && request.method === "POST") {
      const token = getAuthToken(request);
      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }

      const username = verifyToken(token);
      if (!username) {
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
      }

      try {
        const newData = await request.json();
        await env.examentracker_db.put(`user-data:${username}`, JSON.stringify(newData));
        return new Response(JSON.stringify({ success: true, message: "Data saved" }));
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }

    return new Response("Not found", { status: 404 });
  }
}