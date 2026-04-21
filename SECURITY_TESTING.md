# 🧪 Guia de Testes - Auditoria de Segurança

## ✅ FASE 1: Correções Críticas (IMPLEMENTADAS)

### 1. SEC-001: Secure Cookie Flag ✅
**Arquivo:** `src/lib/auth/session.ts:35`
**Alteração:** `secure: process.env.NODE_ENV === "production" || process.env.SECURE_COOKIES === "true"`

**Como Testar em Produção:**
```bash
# Verificar que o cookie tem a flag Secure
curl -I -b cookies.txt https://seu-dominio.com/api/auth/me | grep -i "Set-Cookie"
# Deve conter: "Secure; HttpOnly; SameSite=Lax"
```

**Como Testar em Desenvolvimento:**
```bash
# Com env var SECURE_COOKIES=true
SECURE_COOKIES=true npm run dev

# Fazer login e verificar no DevTools:
# 1. Abrir DevTools (F12)
# 2. Ir para Application → Cookies
# 3. Verificar que carometro_session tem:
#    - HttpOnly: ✅
#    - Secure: ✅ (ou não em dev sem env var)
#    - SameSite: Lax ✅
```

---

### 2. SEC-002: Validação de Tamanho de Arquivo ✅
**Arquivo:** `src/app/api/export-students-pdf/route.ts`
**Alteração:** Adicionado validação de 5MB antes de processar imagem

**Como Testar:**
```bash
# 1. Fazer upload de imagem > 5MB no R2 (se possível)
# 2. Tentar gerar PDF
# 3. Verificar que a imagem foi ignorada (log: "[Security] Image exceeds max size")
# 4. PDF deve gerar mesmo assim (com placeholder para imagem grande)

# Ou, no código R2, simulando:
# Verificar logs: console.warn("[Security] Image exceeds max size...")
```

**Verificação Manual:**
- Abrir `src/app/api/export-students-pdf/route.ts` linha 175-185
- Confirmar que existe: `if (contentLength > MAX_IMAGE_SIZE) return;`

---

### 3. SEC-005: Max Length em Password ✅
**Arquivo:** `src/app/api/auth/login/route.ts:10`
**Alteração:** `password: z.string().min(1).max(256)`

**Como Testar:**
```bash
# Via curl - tentar password com 10MB
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"'$(printf 'A%.0s' {1..10000000})'"}' 

# Deve retornar: 400 Bad Request
# Body: {"error":"Credenciais invalidas."}
```

**Verificação Rápida (Dev Tools):**
```javascript
// Console do navegador
const resp = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'test@example.com', 
    password: 'a'.repeat(500) 
  })
});
console.log(resp.status); // Deve ser 400
```

---

## ✅ FASE 2: Validação de Entrada (IMPLEMENTADAS)

### 4. SEC-003: Validação de Registration Parameter ✅
**Arquivo:** Novo `src/lib/validation/registration.ts`
**Endpoints:** 
- `src/app/api/students/[registration]/photo-upload/route.ts`
- `src/app/api/students/[registration]/photo-upload-url/route.ts`
- `src/app/api/students/[registration]/photo-upload-complete/route.ts`

**Alteração:** Regex validation: `/^[a-zA-Z0-9-_.]+$/`

**Como Testar - Cenários de Segurança:**

```bash
# ❌ DEVE REJEITAR (400):
curl http://localhost:3000/api/students/../../etc/passwd/photo-upload -X POST
# Motivo: "../" não permitido

curl http://localhost:3000/api/students/'; DROP TABLE students;--/photo-upload -X POST
# Motivo: '; caracteres especiais não permitidos

curl "http://localhost:3000/api/students/%00/photo-upload" -X POST
# Motivo: null bytes não permitidos

# ✅ DEVE ACEITAR (então falhar em validação de auth/demo):
curl http://localhost:3000/api/students/MAT123-EX_001/photo-upload -X POST
# Retorna: 401 ou 403 (não 400 de validação)

curl http://localhost:3000/api/students/student.name/photo-upload -X POST
# Retorna: 401 ou 403 (não 400 de validação)
```

**Verificação no Código:**
```bash
# Abrir arquivo e confirmar:
grep -n "regex" src/lib/validation/registration.ts
# Deve conter: /^[a-zA-Z0-9-_.]+$/
```

---

### 5. SEC-004: Rate Limiting em Login ✅
**Arquivo:** Novo `src/lib/middleware/rate-limit.ts`
**Integração:** `src/app/api/auth/login/route.ts`
**Limite:** 5 tentativas por 15 minutos

**Como Testar:**
```bash
# Script bash para testar rate limiting
for i in {1..7}; do
  echo "Tentativa $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -s | jq '.error, .status' || echo "Response: $?"
  
  sleep 1
done

# Resultado esperado:
# Tentativas 1-5: 401 "E-mail ou senha incorretos."
# Tentativas 6-7: 429 "Muitas tentativas de login..."
# Header: Retry-After: ~900 (segundos)
```

**Verificação via JavaScript:**
```javascript
// No DevTools console ou teste automatizado
async function testRateLimit() {
  const email = 'test@example.com';
  
  for (let i = 1; i <= 7; i++) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrong' })
    });
    
    console.log(`Attempt ${i}: Status ${res.status}`);
    console.log(`Retry-After: ${res.headers.get('Retry-After')}`);
    
    if (res.status === 429) {
      console.log('Rate limited! ✅');
      break;
    }
  }
}

testRateLimit();
```

**Verificação no Código:**
- Confirmar `checklLoginRateLimit` é chamado antes de DB query
- Confirmar response 429 com header `Retry-After`

---

## ✅ FASE 3: Security Headers (IMPLEMENTADAS)

### 6. SEC-006: Security Headers ✅
**Arquivo:** `next.config.ts`
**Headers Adicionados:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Como Testar:**
```bash
# Verificar headers em produção/staging:
curl -I https://seu-dominio.com/ | grep -E "X-|Referrer|Permissions"

# Deve retornar:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Testa em Dev (local):**
```bash
npm run build
npm run start

# Em outro terminal:
curl -I http://localhost:3000/ | grep -E "X-|Referrer|Permissions"
```

---

## 📋 Checklist Completo

### ✅ Fase 1
- [ ] ✅ Cookie secure flag configurável via env var
- [ ] ✅ Arquivo > 5MB rejeitado/ignorado em PDF
- [ ] ✅ Password max length 256 validado

### ✅ Fase 2
- [ ] ✅ Registration param restrito a alphanumeric+`-_.`
- [ ] ✅ Rate limiting 5x/15min em login
- [ ] ✅ Response 429 com Retry-After quando limitado

### ✅ Fase 3
- [ ] ✅ Security headers em todas as respostas
- [ ] ✅ Headers testáveis com curl

---

## 🔧 Debugging & Troubleshooting

### Cookie não aparece com Secure flag em dev
**Solução:**
```bash
# Use env var:
SECURE_COOKIES=true npm run dev

# Ou aceite sem Secure em dev (apenas HTTP)
```

### Rate limit não funciona após restart?
**Motivo:** Memory map é resetado após reload (esperado)
**Solução:** Para produção, usar Redis (implementação futura)

### Headers faltando em localhost?
**Motivo:** Headers function pode não rodar em dev local
**Solução:** Testar com `npm run build && npm run start`

---

## 🎯 Próximos Passos

1. ✅ Executar testes manuais acima
2. ✅ Confirmar que tudo passa
3. 📝 **Fase 3:** Implementar LGPD (direito de acesso + exclusão)
4. 🚀 Deploy com segurança

---

**Última atualização:** 21 de Abril de 2026
