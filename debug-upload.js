const base = 'http://localhost:3000';

async function req(path, init = {}) {
  const r = await fetch(base + path, init);
  return { status: r.status, headers: r.headers, text: await r.text() };
}

(async () => {
  const otpRes = await req('/api/auth/login/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'pattugarments@gmail.com' })
  });
  console.log('OTP', otpRes.status, otpRes.text);

  const otp = JSON.parse(otpRes.text).devOtp;
  const loginRes = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'pattugarments@gmail.com', otp })
  });
  console.log('LOGIN', loginRes.status, loginRes.text);

  const cookie = (loginRes.headers.get('set-cookie') ? loginRes.headers.get('set-cookie') : '').split(';')[0];

  const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,200,0,0,0,10,73,68,65,84,120,156,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  const form = new FormData();
  form.append('name', 'Local Upload Test');
  form.append('description', 'Uploaded locally to server storage');
  form.append('price', '199');
  form.append('category', 'Men');
  form.append('stock', '10');
  form.append('image', new Blob([png], { type: 'image/png' }), 'test.png');

  const productRes = await req('/api/products', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form
  });
  console.log('PRODUCT', productRes.status, productRes.text);
})();
