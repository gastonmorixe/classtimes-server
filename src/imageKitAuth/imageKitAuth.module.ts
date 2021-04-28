import { Module } from '@nestjs/common'

import { ImageKitAuthResolver } from './imageKitAuth.resolver'
import { ImageKitAuthService } from './imageKitAuth.service'

@Module({
  imports: [],
  providers: [ImageKitAuthResolver, ImageKitAuthService],
})
export class ImageKitAuthModule {}
