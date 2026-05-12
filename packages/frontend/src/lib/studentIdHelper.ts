/**
 * 学籍番号を入力時に自動大文字変換し、半角英数字以外の文字を排除するフィルタリング処理を行います。
 */
export function filterStudentId(val: string): string {
  return val.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * 学籍番号が 5文字〜15文字 であるかどうかを検証します。
 */
export function validateStudentId(val: string): boolean {
  return val.length >= 5 && val.length <= 15;
}
