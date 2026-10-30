// ユーザー登録 (SIGNUP) と ログイン (LOGIN) のAPI
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action'); // 'signup' または 'login'

  // CORSヘッダー（必要に応じて）
  const headers = { "Content-Type": "application/json" };

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const data = await request.json();

    // ① 新規登録 (signup)
    if (action === "signup") {
      if (!data.username) {
        return Response.json({ error: "ユーザー名を入力してください" }, { status: 400, headers });
      }

      // 最初のユーザー（ID 1など）や特定のユーザーに自動で管理者・君主バッジを付与するロジックもここに組み込めます！
      // 例として、最初期メンバーには「君主」「管理者」バッジをデフォルト付与
      const initialRole = data.username === "iden" ? "admin" : "user";
      const initialBadges = data.username === "iden" ? "君主, 管理者" : "サポーター";

      const result = await env.DB.prepare(
        "INSERT INTO users (username, role, badges) VALUES (?, ?, ?)"
      ).bind(data.username, initialRole, initialBadges).run();

      return Response.json({ success: true, message: "登録完了しました！", username: data.username }, { headers });
    }

    // ② ログイン (login - 簡易版：名前が一致すればOK)
    if (action === "login") {
      if (!data.username) {
        return Response.json({ error: "ユーザー名を入力してください" }, { status: 400, headers });
      }

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE username = ?"
      ).bind(data.username).first();

      if (!user) {
        return Response.json({ error: "ユーザーが見つかりません。新規登録してください。" }, { status: 404, headers });
      }

      return Response.json({ success: true, user }, { headers });
    }

    return Response.json({ error: "Invalid action" }, { status: 400, headers });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers });
  }
}
