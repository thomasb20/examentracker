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

  async fetch(request, env) {
    const url = new URL(request.url);
    alert("Test" + await env.examentracker_db.get("test"));

    if (url.pathname === "/get-data" && request.method === "GET") {
      unprocessed_data = await env.examentracker_db.get("data");
      data = JSON.parse(unprocessed_data);
      return new Response(data);
    }

    else if (url.pathname === "/update-data" && request.method === "POST") {
      const newData = await request.json();
      await env.examentracker_db.put("data", JSON.stringify(newData));
      return new Response("Opgeslagen");
    }
  }
}