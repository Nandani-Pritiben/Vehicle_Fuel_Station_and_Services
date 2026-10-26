import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  // GET /api/places?lat=23.02&lon=72.57&radius=5
  @Get()
  search(@Query('lat') lat: string, @Query('lon') lon: string, @Query('radius') radius = '5') {
    const la = Number(lat), lo = Number(lon), r = Math.min(Number(radius), 50);
    if (![la, lo, r].every(Number.isFinite) || Math.abs(la) > 90 || Math.abs(lo) > 180 || r <= 0) {
      throw new BadRequestException('lat, lon and radius (km, max 50) must be valid numbers');
    }
    return this.places.search(la, lo, r);
  }

  // POST /api/places  - a user adds a shop/station
  @Post()
  add(@Body() b: any) {
    const ok = typeof b?.name === 'string' && b.name.trim().length > 1
      && ['fuel', 'ev', 'garage', 'puncture'].includes(b.type)
      && Number.isFinite(b.lat) && Number.isFinite(b.lon)
      && typeof b.clientId === 'string' && b.clientId.length > 5;
    if (!ok) throw new BadRequestException('name, type, lat, lon and clientId are required');
    return this.places.add(b);
  }

  // POST /api/places/:id/confirm - "yes, this place is really here"
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Body('clientId') clientId: string) {
    if (!clientId) throw new BadRequestException('clientId is required');
    return this.places.confirm(id, clientId);
  }
}
