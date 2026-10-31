export async function onRequest(context) {
  const { env } = context;
  const headers = { 
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    // users テーブルの全データを取得（パスワードは除外して安全に確認）
    const { results } = await env.DB.prepare(
      "SELECT id, username, role, badges, bio, selected_badges, CASE WHEN avatar IS NOT NULL AND avatar != '' THEN 'あり (Base64)' ELSE 'なし' END as avatar_status FROM users"
    ).all();

    return Response.json({ success: true, users: results }, { headers });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { headers });
  }
}
