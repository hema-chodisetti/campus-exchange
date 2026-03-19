import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review, User, Conversation, Bid, Listing } from '../entities';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Bid)
    private bidsRepository: Repository<Bid>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    private dataSource: DataSource,
  ) {}

  async create(reviewerId: number, dto: CreateReviewDto) {
    if (reviewerId === dto.reviewedId) {
      throw new BadRequestException('You cannot review yourself');
    }

    // Verify the reviewed user exists
    const reviewedUser = await this.usersRepository.findOne({
      where: { id: dto.reviewedId },
    });
    if (!reviewedUser) {
      throw new NotFoundException('Reviewed user not found');
    }

    const listing = await this.listingsRepository.findOne({
      where: { id: dto.listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    let hasDirectInteraction = false;

    if (dto.reviewedId === listing.sellerId) {
      const hasConversation = await this.conversationsRepository.findOne({
        where: {
          listingId: dto.listingId,
          buyerId: reviewerId,
          sellerId: listing.sellerId,
        },
      });

      const hasBid = await this.bidsRepository.findOne({
        where: { listingId: dto.listingId, bidderId: reviewerId },
      });

      hasDirectInteraction = !!hasConversation || !!hasBid;
    } else if (reviewerId === listing.sellerId) {
      const hasConversation = await this.conversationsRepository.findOne({
        where: {
          listingId: dto.listingId,
          buyerId: dto.reviewedId,
          sellerId: reviewerId,
        },
      });

      const hasBid = await this.bidsRepository.findOne({
        where: { listingId: dto.listingId, bidderId: dto.reviewedId },
      });

      hasDirectInteraction = !!hasConversation || !!hasBid;
    }

    if (!hasDirectInteraction) {
      throw new BadRequestException(
        'You can only review the other participant in this listing interaction',
      );
    }

    const existing = await this.reviewsRepository.findOne({
      where: { reviewerId, listingId: dto.listingId },
    });
    if (existing) {
      throw new BadRequestException(
        'You have already reviewed this transaction',
      );
    }

    // Use transaction to ensure review and rating update are atomic
    return this.dataSource.transaction(async (manager) => {
      const review = manager.create(Review, {
        reviewerId,
        reviewedId: dto.reviewedId,
        listingId: dto.listingId,
        rating: dto.rating,
        comment: dto.comment,
      });

      await manager.save(review);

      // Update user's average rating
      const { avg, count } = await manager
        .createQueryBuilder(Review, 'review')
        .select('AVG(review.rating)', 'avg')
        .addSelect('COUNT(*)', 'count')
        .where('review.reviewedId = :id', { id: dto.reviewedId })
        .getRawOne();

      await manager.update(User, dto.reviewedId, {
        averageRating: parseFloat(avg) || 0,
        totalRatings: parseInt(count) || 0,
      });

      return review;
    });
  }

  async findByUser(userId: number) {
    const reviews = await this.reviewsRepository.find({
      where: { reviewedId: userId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewer: {
        id: review.reviewer.id,
        firstName: review.reviewer.firstName,
        lastName: review.reviewer.lastName,
      },
    }));
  }
}
