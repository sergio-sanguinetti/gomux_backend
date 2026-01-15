require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

async function createTestUser() {
  try {
    const email = 'admin@gomux.com';
    const password = 'admin123';
    const nombre = 'Administrador Gomux';
    const rol = 'administrador';

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      console.log('❌ El usuario ya existe:', email);
      console.log('   Puedes usar estas credenciales para hacer login:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      await prisma.$disconnect();
      return;
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email,
        password: passwordHash,
        nombre,
        rol,
        activo: true
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true
      }
    });

    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Rol:', rol);
    console.log('\n👤 Información del usuario:');
    console.log('   ID:', nuevoUsuario.id);
    console.log('   Nombre:', nuevoUsuario.nombre);
    console.log('   Email:', nuevoUsuario.email);
    console.log('   Estado:', nuevoUsuario.activo ? 'Activo' : 'Inactivo');

  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createTestUser();

