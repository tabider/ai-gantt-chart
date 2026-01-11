-- 1. タスクに進捗率を追加
ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- 2. コメント機能用のテーブルを作成
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- コメントのRLS（セキュリティ）設定
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 閲覧ポリシー: プロジェクトが見れる人はコメントも見れる
CREATE POLICY "Users can view comments on projects they can view" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = comments.task_id
      AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

-- 投稿ポリシー: プロジェクトの所有者のみコメント可能（現状）
CREATE POLICY "Users can insert comments on projects they own" ON comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = comments.task_id
      AND p.user_id = auth.uid()
    )
  );
