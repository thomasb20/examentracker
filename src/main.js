export default {
  /*
  example data:
  [
    {
      "streefcijfer": 8.5,
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
  "streefcijfer": 8.5,
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

  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === "/test") {
      return new Response("Test" + await env.examentracker_db.get("test"));
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