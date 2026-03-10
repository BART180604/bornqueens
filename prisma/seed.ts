import { PrismaClient, Role } from "../src/generated/prisma"
import bcrypt from 'bcryptjs'


const prisma = new PrismaClient()

async function main() {
  // Créer un admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bornqueens.com',
      username: 'admin',
      password: await bcrypt.hash('password123', 12),
      displayName: 'BornQueens Admin',
      role: Role.ADMIN,
    }
  })

  // Créer des catégories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Afrique de l\'Ouest', slug: 'afrique-ouest', color: '#8B1A4A' } }),
    prisma.category.create({ data: { name: 'Afrique Centrale', slug: 'afrique-centrale', color: '#D4A843' } }),
    prisma.category.create({ data: { name: 'Afrique de l\'Est', slug: 'afrique-est', color: '#2D6A4F' } }),
    prisma.category.create({ data: { name: 'Diaspora', slug: 'diaspora', color: '#4A1942' } }),
  ])

  // Créer des tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'Tresses Fulani', slug: 'tresses-fulani' } }),
    prisma.tag.create({ data: { name: 'Cornrows', slug: 'cornrows' } }),
    prisma.tag.create({ data: { name: 'Locks', slug: 'locks' } }),
    prisma.tag.create({ data: { name: 'Mariage', slug: 'mariage' } }),
    prisma.tag.create({ data: { name: 'Cérémonie', slug: 'ceremonie' } }),
  ])

  console.log('✅ Seed terminé')
  console.log(`   ${categories.length} catégories créées`)
  console.log(`   ${tags.length} tags créés`)
  console.log(`   Admin : admin@bornqueens.com / password123`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())