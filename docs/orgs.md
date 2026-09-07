# Organizations / Multi-tenant

## Models (add to Prisma)

```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  logoUrl   String?
  planType  String   @default("starter")
  seatLimit Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  members   OrgMember[]
  invites   OrgInvite[]
}

model OrgMember {
  id        String   @id @default(uuid())
  orgId     String
  userId    String
  role      String   // owner | admin | coach | member
  createdAt DateTime @default(now())
  org       Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  @@unique([orgId, userId])
}

model OrgInvite {
  id         String   @id @default(uuid())
  orgId      String
  email      String
  role       String
  inviteCode String   @unique
  status     String   @default("pending")
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  org        Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
}
```

## API

- `GET/POST /api/orgs`
- `GET /api/orgs/:orgId`
- `GET/POST /api/orgs/:orgId/members`
- `GET/POST /api/orgs/:orgId/invites`
- `POST /api/orgs/accept`

## Roles

- **owner** — full control
- **admin** — manage members & invites
- **coach** — coaching tools inside the org
- **member** — read access
