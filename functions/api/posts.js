// 投稿の取得 (GET) と 新規投稿の保存 (POST)
export async function onRequest(context) {
  const { request, env } = context;

  // 1. 投稿一覧を取得する場合 (GET)
  if (request.method === "GET") {
    try {
      const { results } = await env.DB.prepare(
        "SELECT * FROM posts ORDER BY id DESC"
      ).all();
      return Response.json(results);
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // 2. 新しい小説やキャラを投稿する場合 (POST)
  if (request.method === "POST") {
    try {
      const data = await request.json();
      
      // 簡易的なバリデーション
      if (!data.title || !data.author || !data.content) {
        return Response.json({ error: "必須項目が抜けています" }, { status: 400 });
      }

      // キャラシ詳細項目に対応した INSERT 文
      await env.DB.prepare(`
        INSERT INTO posts (type, title, author, content, gender, age, occupation, hair_color, origin, height, skills) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.type || 'novel',
        data.title,
        data.author,
        data.content,
        data.gender || null,
        data.age || null,
        data.occupation || null,
        data.hair_color || null,
        data.origin || null,
        data.height || null,
        data.skills || null
      ).run();

      return Response.json({ success: true });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}
