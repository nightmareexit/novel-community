export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // 'post' または 'user'
  const id = url.searchParams.get('id');       // 取得したいID
  const username = url.searchParams.get('username'); // ユーザー名で検索する場合
  
  const headers = { 
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    // ① 作品（キャラシ・小説）の個別データを取得する
    if (type === 'post') {
      if (!id) {
        return Response.json({ error: "IDが指定されていません" }, { status: 400, headers });
      }

      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE id = ?"
      ).bind(id).first();

      if (!post) {
        return Response.json({ error: "作品が見つかりませんでした" }, { status: 404, headers });
      }

      return Response.json({ success: true, post }, { headers });
    }

    // ② ユーザーのプロフィールと、そのユーザーの投稿一覧を取得する
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

      // このユーザーの投稿一覧も一緒に取得する
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
