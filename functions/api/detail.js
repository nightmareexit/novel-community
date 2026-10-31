export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');
  const username = url.searchParams.get('username');
  
  const headers = { 
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    // ① 作品（キャラシ・小説共通）の個別データをIDで直接取得する
    if (type === 'post') {
      if (!id) {
        return Response.json({ error: "IDが指定されていません" }, { status: 400, headers });
      }

      // データベースのIDで直接1件引く
      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(id).first();

      if (!post) {
        return Response.json({ error: "該当する作品が見つかりませんでした" }, { status: 404, headers });
      }

      return Response.json({ success: true, post }, { headers });
    }

    // ② ユーザーのプロフィールと投稿一覧を取得する
    if (type === 'user') {
      let user = null;
      if (id) {
        user = await env.DB.prepare("SELECT id, username, role, badges FROM users WHERE id = ?").bind(id).first();
      } else if (username) {
        user = await env.DB.prepare("SELECT id, username, role, badges FROM users WHERE username = ?").bind(username).first();
      }

      if (!user) {
        return Response.json({ error: "ユーザーが見つかりませんでした" }, { status: 404, headers });
      }

      const { results: posts } = await env.DB.prepare(
        "SELECT * FROM posts WHERE author = ? ORDER BY id DESC"
      ).bind(user.username).all();

      return Response.json({ success: true, user, posts }, { headers });
    }

    return Response.json({ error: "Invalid type parameter" }, { status: 400, headers });

  } catch (err) {
    return Response.json({ error: "サーバーエラー: " + err.message }, { status: 500, headers });
  }
}
