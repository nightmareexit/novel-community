export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // 'post' (または 'character'/'novel') の詳細、または 'user'
  const id = url.searchParams.get('id');       // 欲しいID (例: 1, 2...)
  const targetType = url.searchParams.get('target_type'); // 'character' または 'novel'
  const username = url.searchParams.get('username');
  
  const headers = { 
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    // ① 作品（キャラシ・小説）の個別データを、種類ごとの独立したIDで取得する
    if (type === 'post') {
      if (!id || !targetType) {
        return Response.json({ error: "IDまたはタイプが指定されていません" }, { status: 400, headers });
      }

      // 該当するタイプ（character または novel）の投稿を古い順にすべて取得する
      const { results: posts } = await env.DB.prepare(
        "SELECT * FROM posts WHERE type = ? ORDER BY id ASC"
      ).bind(targetType).all();

      // 指定された番号（例: IDが1なら配列の0番目）のデータを取り出す
      const index = parseInt(id) - 1;
      const post = posts[index];

      if (!post) {
        return Response.json({ error: "該当する作品が見つかりませんでした" }, { status: 404, headers });
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
