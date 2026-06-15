import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AssetsModule } from "./modules/assets/assets.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { InvitationsModule } from "./modules/invitations/invitations.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { MaintenancePlansModule } from "./modules/maintenance-plans/maintenance-plans.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { RequestsModule } from "./modules/requests/requests.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { UsersModule } from "./modules/users/users.module";
import { WorkOrdersModule } from "./modules/work-orders/work-orders.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    InvitationsModule,
    LocationsModule,
    AssetsModule,
    WorkOrdersModule,
    MaintenancePlansModule,
    RequestsModule,
    InventoryModule,
    SuppliersModule,
    ReportsModule,
    AuditModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
