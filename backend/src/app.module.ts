import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlacesController } from './places/places.controller';
import { PlacesService } from './places/places.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })], // loads backend/.env
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class AppModule {}
