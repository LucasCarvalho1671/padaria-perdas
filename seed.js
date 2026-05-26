// seed.js — Cria o primeiro usuário administrador
// Rodado UMA ÚNICA VEZ com: node seed.js
// Pode apagar depois que o usuário for criado.

require('dotenv').config();
const bcrypt = require('bcrypt');
const db     = require('./src/db/index');

const NOME  = 'Administrador';
const EMAIL = 'admin@padaria.com';
const SENHA = 'padaria123';

(async () => {
  try {
    console.log('🔄 Criando usuário administrador...');
    const hash = await bcrypt.hash(SENHA, 10);
    await db.query(
      `INSERT INTO usuarios (nome, email, senha, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [NOME, EMAIL, hash]
    );
    console.log('✅ Usuário criado com sucesso!');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Senha: ${SENHA}`);
    console.log('\n⚠️  Troque a senha depois do primeiro login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
