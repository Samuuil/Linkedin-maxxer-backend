import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy, LocalStrategy, RefreshTokenStrategy } from './strategies';
import { LocalAuthGuard, RefreshAuthGuard } from './guards';
import { JwtProviders } from './providers';
import { UserModule } from '../user';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [
    ...JwtProviders,
    AuthService,
    JwtStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
    LocalAuthGuard,
    RefreshAuthGuard,
  ],
  exports: [AuthService, ...JwtProviders, PassportModule],
})
export class AuthModule {}