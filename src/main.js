export default {
  async fetch(request, env, ctx) {
    let value = await env.examentracker-db.get("test");

    return new Response(value);
  },
};