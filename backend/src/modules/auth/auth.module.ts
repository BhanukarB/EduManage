import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwtHandler/jwt.stategy";
import { AuthRepository } from "./auth.repository";
import { RbacModule } from "../rbac/rbac.module";
import { AuthGuard } from '../../common/guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['../.env', '.env'], isGlobal: true }),
    PassportModule,
    RbacModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "24h" },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, AuthRepository, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
