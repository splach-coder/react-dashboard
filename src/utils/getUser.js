// src/utils/getUser.js
export async function getUser() {
    const isDev = import.meta.env.DEV;
    const url = isDev ? '/.auth/me.json' : '/.auth/me';
  
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('User not authenticated');
      const data = await res.json();
      const claims = data[0]?.user_claims || [];
  
      const user = {
        name: claims.find(c => c.typ === 'name')?.val || '',
        email: claims.find(c => c.typ === 'email')?.val || '',
        id: data[0]?.user_id || '',
      };
  
      return user;
    } catch (err) {
      return null;
    }
}
  