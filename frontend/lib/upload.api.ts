export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/uploads', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('파일 업로드에 실패했습니다.');
  }

  const result = await res.json();
  return result.data; // 서버에서 반환한 파일 URL
};
