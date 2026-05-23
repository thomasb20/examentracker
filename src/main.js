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
    async function generateToken(username){
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2,11);
      return `${username}:${timestamp}:${random}`;
    }

    // Helper: verify de format van een token
    async function verifyToken(token) {
      const parts = token.split(":");
      if (parts.length !== 3) return null;
      return parts[0]; // Return username
    }

    // Helper: haal token uit header
    async function getAuthToken(request){
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

    if (url.pathname === "/get-data" && request.method === "GET") {
      const unprocessed_data = await env.examentracker_db.get("data");
      const data = JSON.parse(unprocessed_data);
      return new Response(JSON.stringify(data));
    }

    else if (url.pathname === "/update-data" && request.method === "POST") {
      const newData = await request.json();
      await env.examentracker_db.put("data", JSON.stringify(newData));
      return new Response("Opgeslagen");
    }
  }
}