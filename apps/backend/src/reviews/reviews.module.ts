import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review, User, Conversation, Bid, Listing } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Review, User, Conversation, Bid, Listing])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
