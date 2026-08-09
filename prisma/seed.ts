import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seeder de PedidosTrinidad...');

  // 1. Limpieza ordenada de base de datos
  await prisma.orderTracking.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.business.deleteMany();
  await prisma.space.deleteMany();
  await prisma.user.deleteMany();

  // Hashes de contraseñas seguras
  const adminPassword = await bcrypt.hash('admin123', 10);
  const storePassword = await bcrypt.hash('tienda123', 10);
  const driverPassword = await bcrypt.hash('driver123', 10);
  const customerPassword = await bcrypt.hash('cliente123', 10);

  // 2. Crear Espacios Físicos (Patios de Comida / Espacios)
  console.log('🏛️ Creando Espacios físicos...');
  const espacioBosque = await prisma.space.create({
    data: {
      name: 'El Bosque',
      description: 'Espacio gastronómico al aire libre con ambiente familiar y música en vivo.',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=60',
    },
  });

  const espacioPlaza = await prisma.space.create({
    data: {
      name: 'Plaza Verde',
      description: 'Boulevard de comidas rápidas, snacks gourmet y cervezas artesanales.',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=60',
    },
  });

  const espacioAloha = await prisma.space.create({
    data: {
      name: 'Aloha Food Park',
      description: 'Food park juvenil con las mejores hamburguesas, pizzas y cócteles tropicales.',
      imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=60',
    },
  });

  const espacioGaleria = await prisma.space.create({
    data: {
      name: 'Galería Central Express',
      description: 'Espacio comercial céntrico con licorerías 24h y farmacias de turno.',
      imageUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop&q=60',
    },
  });

  // 3. Crear Usuarios de Sistema
  console.log('👤 Creando Usuarios por Rol...');

  // Admin General
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@pedidostrinidad.com',
      name: 'Administrador Principal',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+591 76543210',
    },
  });

  // Propietarios de Tiendas
  const ownerDonPepe = await prisma.user.create({
    data: {
      email: 'donpepe@elbosque.com',
      name: 'Don Pepe Burgers',
      password: storePassword,
      role: 'BUSINESS_OWNER',
      phone: '+591 78901234',
    },
  });

  const ownerSushi = await prisma.user.create({
    data: {
      email: 'sushiclub@plazaverde.com',
      name: 'Tokyo Sushi Master',
      password: storePassword,
      role: 'BUSINESS_OWNER',
      phone: '+591 79012345',
    },
  });

  const ownerLicoreria = await prisma.user.create({
    data: {
      email: 'barbosa@galeriacentral.com',
      name: 'Licorería Barbosa 24/7',
      password: storePassword,
      role: 'BUSINESS_OWNER',
      phone: '+591 71230000',
    },
  });

  const ownerFarmacia = await prisma.user.create({
    data: {
      email: 'farmaciavital@galeriacentral.com',
      name: 'Farmacia Vital Trinidad',
      password: storePassword,
      role: 'BUSINESS_OWNER',
      phone: '+591 72340000',
    },
  });

  // Repartidores con Códigos Únicos
  const driver1 = await prisma.user.create({
    data: {
      email: 'repartidor@pedidostrinidad.com',
      name: 'Carlos Repartidor Flash',
      password: driverPassword,
      role: 'DRIVER',
      driverCode: 'DRV-777', // Código principal de prueba
      phone: '+591 70001122',
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      email: 'driver2@pedidostrinidad.com',
      name: 'María Repartidora Veloz',
      password: driverPassword,
      role: 'DRIVER',
      driverCode: 'DRV-888',
      phone: '+591 70003344',
    },
  });

  // Clientes
  const customer1 = await prisma.user.create({
    data: {
      email: 'cliente@gmail.com',
      name: 'Mateo Morales (Cliente)',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+591 71234567',
    },
  });

  // 4. Crear Negocios
  console.log('🏬 Creando Negocios en sus respectivos Espacios...');
  const negocioDonPepe = await prisma.business.create({
    data: {
      name: 'Don Pepe Hamburguesas Artesanales',
      category: 'PATIO_COMIDA',
      spaceId: espacioBosque.id,
      ownerId: ownerDonPepe.id,
      ownerPhone: '+591 78901234',
      isActive: true,
      isOpen: true,
      logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60',
      bannerUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=60',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PEDIDOS-TRINIDAD-DON-PEPE-BNB-ACCOUNT-99882211',
    },
  });

  const negocioSushi = await prisma.business.create({
    data: {
      name: 'Tokyo Sushi Club',
      category: 'PATIO_COMIDA',
      spaceId: espacioPlaza.id,
      ownerId: ownerSushi.id,
      ownerPhone: '+591 79012345',
      isActive: true,
      isOpen: true,
      logoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&auto=format&fit=crop&q=60',
      bannerUrl: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&auto=format&fit=crop&q=60',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PEDIDOS-TRINIDAD-TOKYO-SUSHI-BCP-88334422',
    },
  });

  const negocioLicoreria = await prisma.business.create({
    data: {
      name: 'Barbosa Drinks Express 24h',
      category: 'LICORERIA',
      spaceId: espacioGaleria.id,
      ownerId: ownerLicoreria.id,
      ownerPhone: '+591 71230000',
      isActive: true,
      isOpen: true,
      logoUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=400&auto=format&fit=crop&q=60',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PEDIDOS-TRINIDAD-BARBOSA-BNB-774411',
    },
  });

  const negocioFarmacia = await prisma.business.create({
    data: {
      name: 'Farmacia Vital Trinidad',
      category: 'FARMACIA',
      spaceId: espacioGaleria.id,
      ownerId: ownerFarmacia.id,
      ownerPhone: '+591 72340000',
      isActive: true,
      isOpen: true,
      logoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PEDIDOS-TRINIDAD-FARMACIA-VITAL-FASSIL-332211',
    },
  });

  // 5. Crear Productos individuales estructurados
  console.log('🍔 Insertando Catálogo de Productos...');
  await prisma.product.createMany({
    data: [
      {
        name: 'Hamburguesa Doble Smash BBQ',
        price: 35.0,
        stock: 50,
        description: 'Doble medallón de 120g de carne de res premium, queso cheddar fundido, tocino crujiente, cebolla caramelizada y salsa BBQ especial de la casa.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=60',
        categories: ['Hamburguesas', 'Smash', 'Popular'],
        businessId: negocioDonPepe.id,
        isAvailable: true,
      },
      {
        name: 'Combo Parrillero Don Pepe + Papas Rusticas',
        price: 48.0,
        stock: 30,
        description: 'Hamburguesa de corte parrillero a la leña, porción generosa de papas rústicas sazonadas con paprika y gaseosa de 500ml.',
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=60',
        categories: ['Combos', 'Parrilla', 'Bebidas'],
        businessId: negocioDonPepe.id,
        isAvailable: true,
      },
      {
        name: 'Papas Cheddar & Bacon Mega',
        price: 22.0,
        stock: 40,
        description: 'Bandeja gigante de papas fritas crocantes bañadas en salsa de queso cheddar cremoso y lluvia de tocino ahumado.',
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=60',
        categories: ['Guarniciones', 'Snacks'],
        businessId: negocioDonPepe.id,
        isAvailable: true,
      },
      {
        name: 'Roll Dragón Flameado (10 Cortes)',
        price: 45.0,
        stock: 25,
        description: 'Relleno de langostino crocante y palta, envuelto en salmón flameado con salsa teriyaki dulce y toques de sésamo tostado.',
        imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=60',
        categories: ['Sushi', 'Especialidades', 'Rolls'],
        businessId: negocioSushi.id,
        isAvailable: true,
      },
      {
        name: 'Barco Tokyo Mix (30 Piezas)',
        price: 110.0,
        stock: 15,
        description: 'Variedad de 10 cortes de Dragón Roll, 10 cortes de California Roll y 10 Nigiris y Sashimis frescos.',
        imageUrl: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&auto=format&fit=crop&q=60',
        categories: ['Sushi', 'Combos', 'Para Compartir'],
        businessId: negocioSushi.id,
        isAvailable: true,
      },
      {
        name: 'Combo Fernet Branca 750ml + Coca Cola 2L',
        price: 85.0,
        stock: 40,
        description: 'Botella de Fernet Branca original de 750ml acompañada de gaseosa Coca Cola de 2 Litros y bolsa de hielo.',
        imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=600&auto=format&fit=crop&q=60',
        categories: ['Licorería', 'Combos', 'Bebidas'],
        businessId: negocioLicoreria.id,
        isAvailable: true,
      },
      {
        name: 'Pack Cerveza Huari Tradicional (6x330ml)',
        price: 55.0,
        stock: 60,
        description: 'Six pack de cerveza artesanal Huari bien fría, lista para servir.',
        imageUrl: 'https://images.unsplash.com/photo-1608270199182-3d7729cb1f14?w=600&auto=format&fit=crop&q=60',
        categories: ['Licorería', 'Cervezas'],
        businessId: negocioLicoreria.id,
        isAvailable: true,
      },
      {
        name: 'Kit Antigripal Completo + Vitamina C',
        price: 32.0,
        stock: 50,
        description: 'Tratamiento rápido contra fiebre, dolor corporal y congestión nasal con suplemento efervescente de Vitamina C.',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=60',
        categories: ['Farmacia', 'Salud', 'Emergencias'],
        businessId: negocioFarmacia.id,
        isAvailable: true,
      },
    ],
  });

  console.log('✅ Base de datos sembrada con éxito:');
  console.log('   - 4 Espacios gastronómicos/comerciales');
  console.log('   - 4 Negocios con categorías (Patio de Comida, Licorería, Farmacia)');
  console.log('   - 8 Productos individuales con precios, stock y categorías');
  console.log('   - 1 Admin: admin@pedidostrinidad.com (pass: admin123)');
  console.log('   - 4 Dueños de Tienda: donpepe@elbosque.com, sushiclub@plazaverde.com, etc. (pass: tienda123)');
  console.log('   - 2 Repartidores: repartidor@pedidostrinidad.com (Código: DRV-777, DRV-888)');
  console.log('   - 1 Cliente: cliente@gmail.com (pass: cliente123)');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
